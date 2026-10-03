import { FACILITIES, SERVICE_TYPES, neighbors, clamp, capacity } from './rules.js';
import { graphFor, accessRoads, routeFromFacility } from '../transport/graph.js';

export function services(city, metrics) {
  const graph = graphFor(city), fields = {}, providers = {}, distances = new Map();
  for (const kind of SERVICE_TYPES) {
    fields[kind] = new Float32Array(city.cells.length);
    providers[kind] = new Int32Array(city.cells.length).fill(-1);
  }
  for (const f of city.facilities) {
    const rule = FACILITIES[f.type], fd = metrics.facilities.get(f.id);
    fd.load = 0; fd.capacity = rule.capacity ? rule.capacity*(city.funding?.[rule.service]??1) : rule.power || rule.water;
    if (!rule.service || !fd.active) continue;
    const distance = new Int16Array(city.cells.length).fill(-1), queue = accessRoads(city, f.cells).filter(i => graph.components[i] === fd.component);
    for (const i of queue) distance[i] = 0;
    for (let k = 0; k < queue.length; k++) {
      const i = queue[k];
      if (distance[i] >= rule.radius) continue;
      for (const n of graph.outgoing.get(i)) if (distance[n] < 0) { distance[n] = distance[i] + 1; queue.push(n); }
    }
    distances.set(f.id, distance);
    for (const i of queue) {
      const strength = clamp((.45 + .55 * (1 - distance[i] / rule.radius))*(city.funding?.[rule.service]??1));
      for (const cell of [i, ...neighbors(i, city.size)]) if (strength > fields[rule.service][cell]) {
        fields[rule.service][cell] = strength; providers[rule.service][cell] = f.id;
      }
    }
  }
  // Assign demand to the strongest provider once, avoiding double-counted overlapping coverage.
  for (const b of city.buildings) {
    const component = metrics.details.get(b.id).component;
    for (const kind of SERVICE_TYPES) if (metrics.facilities.get(providers[kind][b.cell])?.component !== component) {
      fields[kind][b.cell] = 0; providers[kind][b.cell] = -1;
    }
    if (b.progress < 1 || b.status === 'abandoned') continue;
    for (const kind of SERVICE_TYPES) {
      const id = providers[kind][b.cell], fd = metrics.facilities.get(id);
      if (!fd) continue;
      const residents = b.type === 'residential' ? b.occupants : capacity(b) * .5;
      fd.load += kind === 'school' ? (b.type === 'residential' ? residents * .16 : 0) :
        kind === 'secondary' ? (b.type === 'residential' ? residents * .07 : 0) :
        kind === 'university' ? (b.type === 'residential' ? residents * .12 : 0) : residents;
    }
  }
  for (const kind of SERVICE_TYPES) for (let i = 0; i < city.cells.length; i++) {
    const fd = metrics.facilities.get(providers[kind][i]);
    if (fd?.capacity) fields[kind][i] *= clamp(fd.capacity / Math.max(1, fd.load));
  }
  const serviceRoutes = [];
  for (const b of city.buildings) {
    const d = metrics.details.get(b.id); d.coverage = {}; d.providers = {};
    for (const kind of SERVICE_TYPES) { d.coverage[kind] = fields[kind][b.cell]; d.providers[kind] = providers[kind][b.cell]; }
    const kind = b.waste > .01 || (city.day % 3 === 0 && b.type === 'residential' && b.occupants > 0) ? 'garbage' : b.type === 'residential' && b.occupants > 0 && d.coverage.police > .4 ? 'police' : null;
    if (!kind || serviceRoutes.filter(r => r.kind === kind).length >= 6 || d.road == null) continue;
    const fd = metrics.facilities.get(d.providers[kind]);
    if (fd?.road != null) {
      const path = routeFromFacility(city, city.facilities.find(f=>f.id===d.providers[kind]), d.road);
      if (path?.length > 1) serviceRoutes.push({ path, kind, delay: path.reduce((s,i)=>s+metrics.delay[i],0)/path.length, volume: 1 });
    }
  }
  return { fields, providers, distances, serviceRoutes };
}
