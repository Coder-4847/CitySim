import { policy } from './districts.js';
import { FACILITIES, clamp, coordinates, capacity } from './rules.js';

const terrainCache = new WeakMap();
function spread(field, city, cell, strength, radius, max = 100) {
  const [cx, cy] = coordinates(cell, city.size);
  for (let y = Math.max(0, cy - radius); y <= Math.min(city.size - 1, cy + radius); y++) for (let x = Math.max(0, cx - radius); x <= Math.min(city.size - 1, cx + radius); x++) {
    const distance = Math.hypot(x - cx, y - cy);
    if (distance < radius) { const i = y * city.size + x; field[i] = Math.min(max, field[i] + strength * (1 - distance / radius) ** 2); }
  }
}
function waterfront(city) {
  if (terrainCache.has(city)) return terrainCache.get(city);
  const field = new Float32Array(city.cells.length);
  for (let i = 0; i < city.cells.length; i++) if (city.cells[i].terrain === 'water') spread(field, city, i, 12, 5, 14);
  terrainCache.set(city, field); return field;
}
export function environment(city, m, coverage) {
  const count = city.cells.length, water = waterfront(city), local = new Map();
  const fields = Object.fromEntries(['pollution', 'groundPollution', 'noise', 'landValue', 'desirability', 'commercialDesire', 'industrialDesire', 'crime', 'health', 'education'].map(key => [key, new Float32Array(count)]));
  const people = new Float32Array(count);
  for (const b of city.buildings) {
    const d = m.details.get(b.id);
    if (b.type === 'industrial' && d.active) spread(fields.pollution, city, b.cell, (policy(city,b.cell,'cleanIndustry')?.5:1) * (24 + d.employed / Math.max(1, capacity(b)) * 20) * (1 + (b.level - 1) * .15), 7);
    if (b.type === 'residential' && b.occupants > 0) spread(people, city, b.cell, b.occupants * .7, 7, 100);
  }
  for (const f of city.facilities) if (m.facilities.get(f.id).active) {const emission=FACILITIES[f.type].pollution ?? (f.type==='garbage'?42:0);if(emission)spread(fields.pollution,city,f.cells[0],emission,7);}
  for (let i = 0; i < count; i++) if (m.flow[i] > 0) {
    spread(fields.noise, city, i, Math.min(18, m.flow[i] * .10), 3);
    spread(fields.pollution, city, i, Math.min(3, m.flow[i] * .012), 2);
  }
  const buildingAt = new Map(city.buildings.map(b => [b.cell, b]));
  for (let i = 0; i < count; i++) {
    const b = buildingAt.get(i), d = b ? m.details.get(b.id) : null;
    const waste = b?.waste || 0, education = b?.education ?? m.education;
    const n = d ? m.networks[d.component] : null;
    const unemployment = n?.workers ? clamp(1 - n.jobs / n.workers) : m.unemployment;
    const pollution = fields.pollution[i], noise = fields.noise[i], delay = d?.commuteDelay || 0;
    fields.groundPollution[i] = city.ground?.[i] || 0;
    const crime = clamp(.12 + unemployment * .40 + (b ? b.level * .06 : .03) + pollution * .001 + waste * .10 - coverage.police[i] * .36 - education * .15);
    const health = clamp(.72 + coverage.healthcare[i] * .25 - pollution * .0038 - waste * .22 - crime * .08);
    const landValue = clamp(43 + water[i] + coverage.park[i] * 23 + coverage.school[i] * 9 + coverage.healthcare[i] * 8 + coverage.police[i] * 6 - pollution * .30 - fields.groundPollution[i] * .15 - noise * .12 - waste * 15 - crime * 10 - Math.min(1, delay) * 10, 0, 100);
    const residential = clamp(65 + coverage.park[i] * 18 + coverage.school[i] * 7 + coverage.healthcare[i] * 10 - pollution * .25 - noise * .12 - waste * 22 - crime * 12 - Math.min(1.5, delay) * 14, 0, 100);
    fields.crime[i] = crime; fields.health[i] = health; fields.education[i] = education;
    fields.landValue[i] = landValue; fields.desirability[i] = residential;
    fields.commercialDesire[i] = clamp(46 + people[i] * .25 + landValue * .15 - Math.min(2, delay) * 20 - waste * 14, 0, 100);
    fields.industrialDesire[i] = clamp(73 - landValue * .12 - Math.min(2, delay) * 18 - waste * 10, 0, 100);
    if (b) local.set(b.id, { landValue, crime, health, desirability: b.type === 'residential' ? residential : b.type !== 'industrial' ? fields.commercialDesire[i] : fields.industrialDesire[i] });
  }
  return { fields, local };
}
