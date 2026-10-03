import { newLife } from './life.js';
import { SIZE, SAVE_VERSION, SERVICE_TYPES, hashSeed, random } from './rules.js';

export function createCity({ name = 'Willow Bay', seed = 'willow', difficulty = 'standard', terrain = 'river' } = {}) {
  const city = {
    version: SAVE_VERSION, funding:Object.fromEntries(SERVICE_TYPES.map(k=>[k,1])), life:newLife(), name: String(name).trim().slice(0, 32) || 'Willow Bay', seed: String(seed).slice(0, 64), terrain,
    size: SIZE, difficulty, rng: hashSeed(seed), day: 0,
    treasury: difficulty === 'relaxed' ? 80000 : difficulty === 'challenging' ? 25000 : 45000,
    taxes: { residential: 9, commercial: 9, industrial: 9, office:9 },
    demand: { residential: 65, commercial: 20, industrial: 65, office:0 },
    districts: [], busRoutes: [],
    cells: [], ground: Array(SIZE * SIZE).fill(0), buildings: [], facilities: [], nextId: 1,
    history: [], timeline: [{ day: 0, text: 'The city charter is signed.' }], ledger: { income: 0, expenses: 0, net: 0 },
    milestone: 0, graphRevision: 0, revision: 0, incidents: [], tutorialDismissed: false,
  };
  const phase = random(city) * Math.PI * 2;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const riverX = SIZE * .69 + Math.sin(y * .16 + phase) * 3;
    const river = terrain === 'river' && Math.abs(x - riverX) < 2.1;
    const coast = terrain === 'coast' && x > SIZE * .76 + Math.sin(y * .11 + phase) * 2;
    const hill = x < 9 && y < 13 && Math.sin(x * .27) + Math.cos(y * .19) > 1.14;
    const elevation = hill ? 2 + Math.floor(random(city) * 3) : 0;
    const water = river || coast;
    city.cells.push({ terrain: water ? 'water' : elevation > 2 ? 'rock' : 'land', elevation,
      tree: !water && !hill && random(city) < .20, variant: Math.floor(random(city) * 7),
      road: false, zone: null, building: null, facility: null,
    });
  }
  return city;
}
