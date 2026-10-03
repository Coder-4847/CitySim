import { performance } from 'node:perf_hooks';
import { createCity } from '../src/simulation/world.js';
import { build, selection } from '../src/simulation/build.js';
import { advance } from '../src/simulation/city.js';
import { measure } from '../src/simulation/metrics.js';
import { serialize, deserialize } from '../src/simulation/save.js';
import { index, neighbors, buildingDefaults } from '../src/simulation/rules.js';

export function fixture(population) {
  const city = createCity({ seed: 'benchmark', terrain: 'plains', difficulty: 'relaxed' });
  const place = (tool, x, y, xx = x, yy = y) => build(city, tool, selection(city, index(x, y), index(xx, yy), tool));
  for (let y = 9; y <= 54; y += 3) place('road', 12, y, 53, y);
  place('road', 12, 9, 12, 54);
  // Constructed stress fixture: bypass organic growth time, never used by the game.
  city.treasury = 1e6;
  for (let n = 0; n < 24; n++) place(n % 2 ? 'water' : 'wind', 13 + n % 12 * 3, 10 + Math.floor(n / 12) * 3);
  city.milestone = 3;
  const departments = ['park','garbage','school','clinic','police','fire','secondary','hospital','university'];
  let department = 0;
  for(let y=16;y<=49;y+=3) for(const x of [13,22,31,40,49]) {
    const result=place(departments[department++%departments.length],x,y);
    if(!result.valid) throw new Error(`Benchmark service placement failed: ${result.reason}`);
  }
  [16,19,25,28,34,37,43,46].forEach((x,n)=>{
    if(!place(n%2?'water':'wind',x,16).valid) throw new Error('Additional benchmark utility placement failed');
  });
  const dense=population>10000,homeCapacity=dense?96:18;
  if(dense){let added=0;for(let y=10;y<=52;y+=3)for(let x=13;x<=49;x+=3){if(added>=48)break;if(place(added%2?'water':'wind',x,y).valid)added++;}if(added<48)throw new Error('Not enough utility footprints for dense stress fixture');}
  let homes = Math.ceil(population / homeCapacity), workplaces = dense?Math.ceil(population*.55/60):Math.ceil(homes * .62), count = 0;
  for (let y = 0; y < city.size; y++) for (let x = 0; x < city.size; x++) {
    const i = index(x, y), c = city.cells[i];
    if (c.road || c.facility != null || c.terrain !== 'land' || !neighbors(i,city.size).some(j=>city.cells[j].road)) continue;
    if (!homes && !workplaces) continue;
    const type = homes ? 'residential' : dense?'commercial':'industrial';
    const id = city.nextId++;
    c.tree = false; c.zone = type; c.building = id;c.density=dense?2:1;
    city.buildings.push(buildingDefaults({ id, cell: i, type, density:dense?2:1, level:dense?3:1, variant: count++ % 8, progress: 1, duration: 12, occupants: homes ? Math.min(homeCapacity, population - (Math.ceil(population / homeCapacity) - homes) * homeCapacity) : 0, name: 'Benchmark parcel' }));
    if (homes) homes--; else workplaces--;
  }
  if (homes || workplaces) throw new Error('Stress fixture exceeds this map capacity');
  if (Math.round(city.buildings.reduce((s,b)=>s+b.occupants,0)) !== population) throw new Error('Stress fixture population differs from its label');
  serialize(city);
  return city;
}
const results = [];
const samples=process.argv.includes('--large')?[25000,50000]:[1000,5000,10000];
for (const population of samples) {
  let city;try{city=fixture(population);}catch(error){if(!error.message.includes('map capacity'))throw error;results.push({initialPopulation:population,unsupported:error.message});continue;}
  if(global.gc)global.gc();const heapBefore=process.memoryUsage().heapUsed;
  const routeStart = performance.now(); const metrics = measure(city); const routeMs = performance.now() - routeStart;
  const tickStart = performance.now(); advance(city, 360); const ticksMs = performance.now() - tickStart;
  const saveStart = performance.now(); const saved = serialize(city); const saveMs = performance.now() - saveStart;
  const loadStart = performance.now(); deserialize(saved); const loadMs = performance.now() - loadStart;
  if(global.gc)global.gc();
  results.push({ initialPopulation: population, buildings: city.buildings.length, facilities:city.facilities.length, roads: metrics.roads, initiallyActive: [...metrics.details.values()].filter(d=>d.active).length, routes: metrics.routes.length,
    firstRouteCalculationMs: +routeMs.toFixed(2), averageTickMs: +(ticksMs / 360).toFixed(3), saveMs: +saveMs.toFixed(2),
    loadMs: +loadMs.toFixed(2), heapDeltaMB:+((process.memoryUsage().heapUsed-heapBefore)/1048576).toFixed(2), saveKB: +(saved.length / 1024).toFixed(1), endingPopulation: measure(city).population });
}
console.log(JSON.stringify({ runtime: process.version, fixture: 'Constructed utility-connected cities with 60 civic facilities; 360 days; congestion and coverage are deliberately stressed', results }, null, 2));
