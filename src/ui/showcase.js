import { createCity } from '../simulation/world.js';
import { build, selection } from '../simulation/build.js';
import { advance } from '../simulation/city.js';
import { index } from '../simulation/rules.js';

export function showcase() {
  const city = createCity({ name: 'Willow Bay', seed: 'willow-7', difficulty: 'relaxed' });
  for (let x = 15; x <= 33; x += 3) build(city, 'road', selection(city, index(x, 18), index(x, 36), 'road'));
  for (let y = 18; y <= 36; y += 3) build(city, 'road', selection(city, index(15, y), index(34, y), 'road'));
  for (const [x, y, tool] of [[16, 19, 'wind'], [19, 19, 'water'], [25, 19, 'wind'], [28, 19, 'water']]) build(city, tool, selection(city, index(x, y), index(x, y), tool));
  const amenities = [[16,25,'clinic'],[19,25,'park'],[22,25,'school'],[25,25,'fire'],[22,28,'police'],[31,19,'garbage']];
  const reserved = new Set(amenities.flatMap(([x,y])=>[index(x,y),index(x+1,y),index(x,y+1),index(x+1,y+1)]));
  for (const [x,y,tool] of amenities.filter(([, ,t])=>['park','garbage'].includes(t))) build(city,tool,selection(city,index(x,y),index(x,y),tool));
  for (let y = 22; y < 36; y++) for (let x = 16; x < 33; x++) {
    if (city.cells[index(x, y)].road || reserved.has(index(x,y))) continue;
    build(city, x > 29 ? 'industrial' : x > 24 ? 'commercial' : 'residential', [index(x, y)]);
  }
  advance(city, 120);
  for (const [x,y,tool] of amenities.filter(([, ,t])=>!['park','garbage'].includes(t))) build(city,tool,selection(city,index(x,y),index(x,y),tool));
  advance(city, 400);
  return city;
}
