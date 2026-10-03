import { random, clamp } from './rules.js';

export function startFire(city, buildingId) {
  const b = city.buildings.find(b => b.id === buildingId);
  if (!b || b.progress < 1 || b.status === 'abandoned' || city.incidents.some(i => i.buildingId === buildingId)) return false;
  city.incidents.push({ id: city.nextId++, buildingId, age: 0, severity: .15, responderId: null, arrival: 0 });
  city.timeline.push({ day: city.day, text: `A fire is reported at ${b.name}.` }); city.revision++;
  return true;
}
export function updateIncidents(city, m) {
  if (city.day % 12 === 0 && city.buildings.length && random(city) < .018) {
    const candidates = city.buildings.filter(b => b.progress >= 1 && b.status !== 'abandoned');
    const b = candidates[Math.floor(random(city) * candidates.length)];
    if (b && random(city) < .35 + (b.type === 'industrial' ? .25 : 0) + b.waste * .2 - m.details.get(b.id).coverage.fire * .25) startFire(city, b.id);
  }
  city.incidents = city.incidents.filter(incident => {
    const b = city.buildings.find(b => b.id === incident.buildingId), d = b && m.details.get(b.id);
    if (!b) return false;
    incident.age++;
    const responderId = d.providers.fire, route = m.routes.find(r => r.incidentId === incident.id);
    if (!route || responderId !== incident.responderId) {
      incident.responderId = route ? responderId : null;
      incident.arrival = route ? incident.age + Math.max(1, Math.ceil((route.path.length - 1) / 5 * (1 + route.delay))) : 0;
    }
    const responding = route && incident.age >= incident.arrival;
    incident.severity = clamp(incident.severity + (responding ? -.09 * Math.max(.4, d.coverage.fire) : .035));
    b.damage = clamp(b.damage + incident.severity * .035);
    if (incident.severity <= 0) {
      city.timeline.push({ day: city.day, text: `Fire crews contain the fire at ${b.name}.` }); return false;
    }
    if (b.damage >= 1) {
      b.status = 'abandoned'; b.goodDays = 0;
      city.timeline.push({ day: city.day, text: `${b.name} is evacuated after fire damage. Restore services to recover it.` }); return false;
    }
    return true;
  });
}
