import { createCity } from '../src/simulation/world.js';
import { build, selection } from '../src/simulation/build.js';
import { index } from '../src/simulation/rules.js';

export const at = (x, y) => index(x, y);
export function place(city, tool, x1, y1, x2 = x1, y2 = y1) {
  return build(city, tool, selection(city, at(x1, y1), at(x2, y2), tool));
}
export function town(options = {}) {
  const city = createCity({ seed: 'test-town', terrain: 'plains', ...options });
  place(city, 'road', 10, 20, 30, 20);
  place(city, 'wind', 10, 21); place(city, 'water', 13, 21);
  place(city, 'residential', 16, 21, 25, 21);
  place(city, 'industrial', 16, 19, 25, 19);
  place(city, 'commercial', 10, 19, 14, 19);
  return city;
}
