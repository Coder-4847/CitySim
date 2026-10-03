import { updateLife } from './life.js';
import { policy } from './districts.js';
import { ZONES, officeEducation, clamp, random, capacity, buildingDefaults, STAGES, STAGE_POPULATION, utilityNeed } from './rules.js';
import { measure, parcelSupply, invalidateMetrics } from './metrics.js';
import { graphFor, accessRoads } from '../transport/graph.js';
import { evolve } from './evolution.js';
import { updateIncidents } from './incidents.js';

const prefixes = ['Willow', 'Cedar', 'Alder', 'Juniper', 'Brook', 'Harbor', 'Maple', 'Orchard'];
function updateDemand(city, m) {
  const industrial = city.buildings.filter(b => b.type === 'industrial' && b.status !== 'abandoned').reduce((s,b) => s + capacity(b), 0) / 16;
  const commercial = city.buildings.filter(b => b.type === 'commercial' && b.status !== 'abandoned').reduce((s,b) => s + capacity(b), 0) / 10;
  const pendingHomes = city.buildings.filter(b => b.type === 'residential' && b.progress < 1).reduce((s,b)=>s+capacity(b),0);
  const office=city.buildings.filter(b=>b.type==='office').reduce((s,b)=>s+capacity(b),0);
  const targets = {
    office: 12 + m.population*(.12+m.education*.3)-office*.8-(city.taxes.office-9)*9-m.averageDelay*15,
    residential: (city.day<city.life.festivalUntil?78:68) + (m.jobs - m.workforce) * 1.1 - (m.housing + pendingHomes - m.population) * .55 - (city.taxes.residential - 9) * 9 + (m.health - .72) * 25 - m.averageDelay * 12,
    commercial: 12 + m.population * .38 - commercial * 14 - (city.taxes.commercial - 9) * 9 + m.education * 12 - m.averageDelay * 16,
    industrial: 70 + m.workforce * .6 - industrial * 14 + m.trade.connectedIndustry * 2 - (city.taxes.industrial - 9) * 9 - m.averageDelay * 14,
  };
  for (const type of Object.keys(ZONES)) city.demand[type] += (clamp(targets[type], -100, 100) - city.demand[type]) * .055;
}
function develop(city, m) {
  const available = { ...city.demand };
  const candidates = city.cells.map((c, i) => c.zone && c.building == null && !c.road && c.facility == null ? i : -1).filter(i => i >= 0);
  // A seeded shuffle prevents development from always starting at the map's top left.
  for (let j = candidates.length - 1; j > 0; j--) { const k = Math.floor(random(city) * (j + 1)); [candidates[j], candidates[k]] = [candidates[k], candidates[j]]; }
  const starts = { residential: 0, commercial: 0, industrial: 0, office:0 };
  for (const i of candidates) {
    const type = city.cells[i].zone;
    const desire = m.fields[type === 'residential' ? 'desirability' : type !== 'industrial' ? 'commercialDesire' : 'industrialDesire'][i];
    if ((type==='office' && m.education<officeEducation(city.cells[i].density)) || available[type]+(policy(city,i,'taxRelief')?15:0) < 16 || desire < 30 || starts[type] >= 3 || !parcelSupply(city, i, m, type) || random(city) > .60) continue;
    const b = buildingDefaults({ id: city.nextId++, cell: i, type, density:city.cells[i].density||1, level: 1, variant: Math.floor(random(city) * 8),
      progress: 0, duration: 8 + Math.floor(random(city) * 9), occupants: 0,
      name: `${prefixes[Math.floor(random(city) * prefixes.length)]} ${type === 'residential' ? 'House' : type === 'commercial' ? 'Market' : type==='office'?'Offices':'Manufacturing'}` });
    city.buildings.push(b); city.cells[i].building = b.id; city.cells[i].tree = false;
    starts[type]++; available[type] -= 15;
    const road = accessRoads(city, [i])[0], n = m.networks[graphFor(city).components[road]];
    n.powerDemand += utilityNeed(b, 'power'); n.waterDemand += utilityNeed(b, 'water');
  }
}
export function tick(city) {
  city.day++;
  const m = measure(city, false);
  evolve(city, m);
  updateIncidents(city, m);
  updateDemand(city, m);
  if (city.day % 4 === 0) develop(city, m);
  city.revision++; invalidateMetrics(city);
  if (city.day % 30 === 0) {
    const month = measure(city);
    city.ledger = { income: month.income, expenses: month.expenses, net: month.net };
    city.treasury += month.net;
    updateLife(city,month);
    city.history.push({ day: city.day, population: month.population, jobs: month.jobs, unemployment: month.unemployment,
      treasury: Math.round(city.treasury), income: month.income, expenses: month.expenses, power: month.powerDemand,
      water: month.waterDemand, traffic: month.maxTraffic, demand: { ...city.demand },
      health: month.health * 100, education: month.education * 100, landValue: month.landValue,
      crime: month.crime * 100, commuteDelay: month.averageDelay * 100, garbage: month.garbageCollection * 100,
      pollution: month.fields.pollution.reduce((sum,v) => sum + v, 0) / city.cells.length, abandoned: month.abandoned, ridership:month.transit.riders, transitDemand:month.transit.demand, fareRevenue:month.transit.revenue, imports:month.trade.imports, exports:month.trade.exports });
    if (city.history.length > 240) city.history.shift();
    const milestone = STAGE_POPULATION.findLastIndex(n => month.population >= n);
    if (milestone > city.milestone) {
      city.milestone = milestone;
      city.timeline.push({ day: city.day, text: `Population reaches ${month.population}. ${STAGES[milestone]} status unlocks new civic opportunities.` });
    }
  }
  if (city.timeline.length > 100) city.timeline.splice(0, city.timeline.length - 100);
}
export function advance(city, days) { for (let i = 0; i < days; i++) tick(city); return city; }
export function conditions(city, building, metrics) {
  const d = metrics.details.get(building.id), problems = [];
  if (!d.connected) problems.push('No road access');
  if (d.power < .95) problems.push('Electricity shortage');
  if (d.water < .95) problems.push('Water shortage');
  if (building.type !== 'residential' && d.active && d.employed < capacity(building) * .7) problems.push('Worker shortage');
  if (building.type === 'residential' && metrics.unemployment > .25) problems.push('Few accessible jobs');
  if (building.waste > .4) problems.push('Waste is accumulating: add collection capacity');
  if (d.health < .6) problems.push('Poor health: reduce pollution and improve healthcare');
  if (d.desirability < 40) problems.push('Unattractive surroundings');
  if (d.commuteDelay > .3) problems.push('Congestion delays commuting and service trips');
  if (building.status === 'abandoned') problems.push('Abandoned: needs 60 prosperous days, demand, and spare utilities to reopen');
  if (city.incidents.some(i => i.buildingId === building.id)) problems.push('Active fire: connect an operational fire station');
  return problems;
}
