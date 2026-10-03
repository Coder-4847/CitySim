import { roadRule } from '../transport/roads.js';
import { effectiveTax, policy } from './districts.js';
import { FACILITIES, ZONES, ROAD_MAINTENANCE, clamp, capacity, utilityNeed } from './rules.js';
import { graphFor, accessRoads, routeFromFacility } from '../transport/graph.js';
import { traffic } from '../transport/traffic.js';
import { services } from './services.js';
import { environment } from './environment.js';

const cache = new WeakMap();
export function measure(city) {
  const key = [city.day, city.revision, city.graphRevision, city.buildings.length, ...Object.values(city.taxes)].join(':');
  const previous = cache.get(city);
  if (previous?.key === key) return previous.metrics;
  const graph = graphFor(city);
  const networks = Array.from({ length: graph.componentCount }, () => ({ power: 0, water: 0, powerDemand: 0, waterDemand: 0, jobs: 0, workers: 0 }));
  const details = new Map(), facilities = new Map();
  let population = 0, housing = 0, jobs = 0, educationTotal = 0;
  let utilityExpenses = 0, serviceExpenses = 0;
  for (const f of city.facilities) {
    const access = accessRoads(city, f.cells), component = access.length ? graph.components[access[0]] : -1;
    const rule = FACILITIES[f.type];
    if (rule.service || rule.fleet) serviceExpenses += rule.maintenance*(city.funding?.[rule.service]??1); else utilityExpenses += rule.maintenance;
    facilities.set(f.id, { component, road: access[0], connected: component >= 0, active: false, load: 0, capacity: rule.capacity || rule.power || rule.water });
    if (component >= 0) {
      networks[component].power += rule.power; networks[component].water += rule.usePower?0:rule.water;
      networks[component].powerDemand += rule.usePower || 0; networks[component].waterDemand += rule.useWater || 0;
    }
  }
  for (const b of city.buildings) {
    const access = accessRoads(city, [b.cell]), road = access[0], component = access.length ? graph.components[road] : -1;
    details.set(b.id, { road, component, connected: component >= 0, power: 0, water: 0, active: false, operable: false, employed: 0 });
    if (component >= 0 && b.status !== 'abandoned') { networks[component].powerDemand += utilityNeed(b, 'power'); networks[component].waterDemand += utilityNeed(b, 'water'); }
    if (b.type === 'residential' && b.progress >= 1) { population += b.occupants; housing += capacity(b); educationTotal += b.occupants * (b.education ?? .15); }
  }
  // Powered water production is evaluated after every consumer has reserved demand.
  for(const f of city.facilities){const rule=FACILITIES[f.type],n=networks[facilities.get(f.id).component];if(n&&rule.water&&rule.usePower&&n.power>=n.powerDemand*.95)n.water+=rule.water;}
  for (const b of city.buildings) {
    const d = details.get(b.id), n = networks[d.component];
    if (n) { d.power = clamp(n.power / Math.max(1, n.powerDemand)); d.water = clamp(n.water / Math.max(1, n.waterDemand)); }
    d.operable = b.progress >= 1 && d.connected && d.power >= .95 && d.water >= .95;
    d.active = d.operable && b.status !== 'abandoned';
    if (d.active && b.type !== 'residential') { jobs += capacity(b); n.jobs += capacity(b); }
    if (b.type === 'residential' && b.progress >= 1 && n) n.workers += b.occupants * .55;
  }
  for (const f of city.facilities) {
    const d = facilities.get(f.id), n = networks[d.component], rule = FACILITIES[f.type];
    d.active = d.connected && (!(rule.service || rule.fleet || rule.usePower) || n.power >= n.powerDemand * .95) && (!(rule.service || rule.fleet || rule.useWater) || n.water >= n.waterDemand * .95);
  }
  let employed = 0;
  for (const n of networks) { n.employed = Math.min(n.workers, n.jobs); employed += n.employed; }
  for (const b of city.buildings) {
    const d = details.get(b.id), n = networks[d.component];
    if (d.active && b.type !== 'residential') d.employed = capacity(b) * Math.min(1, n.workers / Math.max(1, n.jobs));
  }
  const workforce = population * .55, roads = graph.adjacency.size;
  const m = { population: Math.round(population), housing, jobs, workforce: Math.round(workforce), employed: Math.round(employed),
    unemployment: workforce ? clamp(1 - employed / workforce) : 0, vacancies: Math.max(0, Math.round(jobs - employed)),
    education: population ? educationTotal / population : .15,
    roads, networks, details, facilities, utilityExpenses, serviceExpenses,
    power: networks.reduce((s, n) => s + n.power, 0), water: networks.reduce((s, n) => s + n.water, 0),
    powerDemand: networks.reduce((s, n) => s + n.powerDemand, 0), waterDemand: networks.reduce((s, n) => s + n.waterDemand, 0),
  };
  const labor=new Map();
  for(const b of city.buildings){const d=details.get(b.id);if(!d.active)continue;const region=graph.travelComponents[d.road];if(!labor.has(region))labor.set(region,{workers:0,jobs:0});const l=labor.get(region);if(b.type==='residential')l.workers+=b.occupants*.55;else l.jobs+=capacity(b);}
  employed=0;
  for(const n of networks)n.employed=0;
  for(const b of city.buildings){const d=details.get(b.id);if(!d.active)continue;const l=labor.get(graph.travelComponents[d.road]);if(b.type==='residential')d.reachableJobs=l.jobs>0;else{d.employed=capacity(b)*Math.min(1,l.workers/Math.max(1,l.jobs));employed+=d.employed;networks[d.component].employed+=d.employed;}}
  m.employed=Math.round(employed);m.unemployment=workforce?clamp(1-employed/workforce):0;m.vacancies=Math.max(0,Math.round(jobs-employed));
  Object.assign(m, traffic(city, details, networks, facilities));
  const service = services(city, m), urban = environment(city, m, service.fields);
  m.fields = { ...service.fields, ...urban.fields }; m.serviceRoutes = service.serviceRoutes;
  let income = 0, weightedHealth = 0, weightedValue = 0, weightedCrime = 0, garbageCollected = 0, wasteDemand = 0;
  const incomeByType = { residential: 0, commercial: 0, industrial: 0, office:0 };
  for (const b of city.buildings) {
    const d = details.get(b.id); Object.assign(d, urban.local.get(b.id));
    d.productivity = clamp(1 / (1 + d.commuteDelay * .8) * (1 - (b.waste || 0) * .18), .2, 1);
    if(b.type==='commercial')d.productivity*=d.goodsSupply;
    if(b.type==='industrial'){d.productivity*=d.externalAccess?1.15:.85;if(policy(city,b.cell,'cleanIndustry'))d.productivity*=.9;}
    if(b.type==='office')d.productivity*=clamp(m.education/.55,.15,1);
    if (b.level > 1 && b.type !== 'residential') d.productivity *= clamp((m.education + .20) / (b.level === 3 ? .7 : .45), .4, 1);
    if (b.type === 'residential') {
      const wealth = .78 + d.landValue / 100 * .40 + (b.education ?? .15) * .25;
      incomeByType.residential += b.occupants * 3.4 * effectiveTax(city,b) / 9 * wealth;
      weightedHealth += d.health * b.occupants; weightedValue += d.landValue * b.occupants; weightedCrime += d.crime * b.occupants;
    } else if (d.active) incomeByType[b.type] += d.employed * (b.type === 'office' ? 7 : b.type === 'commercial' ? 5.8 : 4.8) * effectiveTax(city,b) / 9 * d.productivity;
    const waste = b.type === 'residential' ? b.occupants : capacity(b) * .5;
    wasteDemand += waste; garbageCollected += waste * d.coverage.garbage;
  }
  for (const incident of city.incidents || []) {
    const b = city.buildings.find(b => b.id === incident.buildingId), d = b && details.get(b.id);
    const station = d && facilities.get(d.providers.fire);
    const path = station?.active && d.road != null ? routeFromFacility(city,city.facilities.find(f=>f.id===d.providers.fire),d.road) : null;
    if (path?.length) m.routes.push({ path, kind: 'fire', volume: 1, delay: path.reduce((s,i) => s + m.delay[i], 0) / path.length, incidentId: incident.id });
  }
  for (const b of city.buildings) {
    const d = details.get(b.id), clinic = facilities.get(d.providers.healthcare);
    if (b.type !== 'residential' || b.occupants < 1 || d.health >= .65 || !clinic?.active || d.road == null || m.routes.filter(r => r.kind === 'healthcare').length >= 6) continue;
    const path = routeFromFacility(city,city.facilities.find(f=>f.id===d.providers.healthcare),d.road);
    if (path?.length > 1) m.routes.push({ path, kind: 'healthcare', volume: 1, delay: path.reduce((s,i) => s + m.delay[i], 0) / path.length });
  }
  m.routes.push(...service.serviceRoutes);
  income = Object.values(incomeByType).reduce((s,v)=>s+v,0);
  const roadExpenses=[...graph.adjacency.keys()].reduce((s,i)=>s+roadRule(city.cells[i]).maintenance+(city.cells[i].signal?.2:0),0);
  income+=m.transit.revenue;
  const expenses = Math.round(roadExpenses + utilityExpenses + serviceExpenses + m.transit.expenses);
  Object.assign(m, { income: Math.round(income), incomeByType, roadExpenses, transportExpenses:m.transit.expenses, expenses, net: Math.round(income) - expenses,
    health: population ? weightedHealth / population : .72, landValue: population ? weightedValue / population : 43,
    crime: population ? weightedCrime / population : .1, garbageCollection: wasteDemand ? garbageCollected / wasteDemand : 1,
    abandoned: city.buildings.filter(b => b.status === 'abandoned').length,
    shortage: city.buildings.filter(b => { const d = details.get(b.id); return !d.connected || d.power < .95 || d.water < .95; }).length,
  });
  cache.set(city, { key, metrics: m }); return m;
}
export function invalidateMetrics(city) { cache.delete(city); }
export function parcelSupply(city, i, metrics, type = 'industrial') {
  const roads = accessRoads(city, [i]); if (!roads.length) return false;
  const n = metrics.networks[graphFor(city).components[roads[0]]];
  return n && n.power >= n.powerDemand + ZONES[type].power*(city.cells[i].density||1) && n.water >= n.waterDemand + ZONES[type].water*(city.cells[i].density||1);
}
