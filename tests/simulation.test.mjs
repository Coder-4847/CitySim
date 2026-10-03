import test from 'node:test';
import assert from 'node:assert/strict';
import { createCity } from '../src/simulation/world.js';
import { advance } from '../src/simulation/city.js';
import { measure } from '../src/simulation/metrics.js';
import { build, selection, planBuild } from '../src/simulation/build.js';
import { graphFor, findRoute } from '../src/transport/graph.js';
import { serialize, deserialize } from '../src/simulation/save.js';
import { at, place, town } from './fixtures.mjs';
import { hashSeed } from '../src/simulation/rules.js';

test('terrain is deterministic, seed-sensitive, and new cities are empty', () => {
  const a = createCity({ seed: 'a' }), b = createCity({ seed: 'a' }), c = createCity({ seed: 'b' });
  assert.deepEqual(a, b); assert.notDeepEqual(a.cells, c.cells);
  assert.ok(a.cells.some(c => c.terrain === 'water')); assert.ok(a.cells.some(c => c.terrain === 'rock'));
  assert.equal(a.buildings.length, 0); assert.equal(a.cells.filter(c => c.road || c.zone).length, 0);
  assert.equal(createCity({ terrain: 'plains' }).cells.filter(c => c.terrain === 'water').length, 0);
});
test('construction is atomic, affordable, and validates map boundaries', () => {
  const city = createCity({ terrain: 'plains' }); city.treasury = 44;
  assert.equal(place(city, 'road', 20, 20).valid, false); assert.equal(city.treasury, 44);
  city.treasury = 10000;
  assert.equal(place(city, 'water', 55, 55).valid, false);
  const rock = city.cells.findIndex(c => c.terrain === 'rock');
  assert.equal(build(city, 'road', [at(20, 20), rock]).valid, false); assert.equal(city.cells[at(20, 20)].road, false);
  assert.ok(place(city, 'wind', 20, 20).valid);
  assert.equal(place(city, 'road', 20, 20).valid, false);
  assert.equal(build(city, 'water', [at(30,30), at(31,30)]).valid, false);
});
test('bridge costs and river crossings use real connected road tiles', () => {
  const city = createCity({ seed: 'a' }), start = city.treasury;
  const cells = selection(city, at(30, 25), at(47, 25), 'road');
  const waterCount = cells.filter(i => city.cells[i].terrain === 'water').length;
  assert.ok(waterCount > 0);
  const plan = planBuild(city, 'road', cells);
  assert.equal(plan.cost, (cells.length - waterCount) * 45 + waterCount * 180);
  build(city, 'road', cells); assert.equal(start - city.treasury, plan.cost);
  assert.equal(findRoute(city, cells[0], cells.at(-1)).length, cells.length);
});
test('road graph finds shortest routes and invalidates caches after intersection demolition', () => {
  const city = createCity({ terrain: 'plains' });
  place(city, 'road', 10, 20, 30, 20); place(city, 'road', 20, 15, 20, 25);
  const oldGraph = graphFor(city);
  assert.equal(findRoute(city, at(10, 20), at(20, 15)).length, 16);
  assert.ok(oldGraph.routes.size); place(city, 'bulldoze', 20, 20);
  assert.notEqual(graphFor(city), oldGraph); assert.equal(graphFor(city).componentCount, 4);
  assert.equal(findRoute(city, at(10, 20), at(30, 20)), null);
  place(city, 'road', 20, 20); assert.equal(findRoute(city, at(10, 20), at(30, 20)).length, 21);
});
test('zoning waits for roads, electricity, and water', () => {
  const city = createCity({ terrain: 'plains' });
  place(city, 'residential', 16, 21, 25, 21); advance(city, 40); assert.equal(city.buildings.length, 0);
  place(city, 'road', 10, 20, 30, 20); advance(city, 40); assert.equal(city.buildings.length, 0);
  place(city, 'wind', 10, 21); advance(city, 40); assert.equal(city.buildings.length, 0);
  place(city, 'water', 13, 21); advance(city, 40); assert.ok(city.buildings.length > 0);
});
test('a serviced town develops each RCI type, residents, real jobs and income', () => {
  const city = town(); advance(city, 180); const m = measure(city);
  for (const type of ['residential', 'commercial', 'industrial']) assert.ok(city.buildings.some(b => b.type === type && b.progress === 1), type);
  assert.ok(m.population > 100); assert.ok(m.jobs > 0); assert.ok(m.income > 0); assert.ok(m.net > 0);
  assert.ok(m.employed <= m.workforce + 1); assert.ok(m.employed <= m.jobs);
  assert.ok(m.routes.length); assert.ok(m.flow.some(v => v > 0));
  assert.ok(city.history.length >= 6); assert.ok(city.milestone >= 1);
});
test('disconnected utilities cannot supply an isolated neighborhood', () => {
  const city = town(); place(city, 'road', 40, 20, 48, 20); place(city, 'residential', 40, 21, 48, 21);
  advance(city, 160);
  assert.equal(city.buildings.filter(b => b.cell % 56 >= 40).length, 0);
  place(city, 'road', 30, 20, 40, 20); advance(city, 160);
  assert.ok(city.buildings.some(b => b.cell % 56 >= 40));
});
test('utility removal changes operational jobs and residents, and restoration recovers', () => {
  const city = town(); advance(city, 180); const population = measure(city).population;
  place(city, 'bulldoze', 10, 21); assert.equal(city.facilities.filter(f => f.type === 'wind').length, 0);
  const m = measure(city); assert.equal(m.jobs, 0); assert.ok(m.shortage > 0);
  advance(city, 35); assert.ok(measure(city).population < population); assert.ok(city.buildings.every(b => b.occupants >= 0));
  place(city, 'wind', 10, 21); advance(city, 80); assert.ok(measure(city).population > 0); assert.ok(measure(city).jobs > 0);
});
test('taxes raise per-capita revenue but suppress demand and migration', () => {
  const low = town(); advance(low, 180); const high = deserialize(serialize(low)).city;
  for (const type of Object.keys(high.taxes)) high.taxes[type] = 20;
  assert.ok(measure(high).income > measure(low).income);
  advance(low, 90); advance(high, 90);
  assert.ok(high.demand.residential < low.demand.residential);
  assert.ok(measure(high).population < measure(low).population);
});
test('accounting settles on the monthly boundary with real maintenance', () => {
  const city = createCity({ terrain: 'plains' }); place(city, 'road', 20, 20, 29, 20);
  const balance = city.treasury; advance(city, 29); assert.equal(city.treasury, balance);
  advance(city, 1); assert.equal(city.treasury, balance - 8); assert.equal(city.ledger.expenses, 8);
});
test('demolition and de-zoning do not leave stale entities or references', () => {
  const city = town(); advance(city, 80); const b = city.buildings[0];
  assert.equal(build(city, 'dezone', [b.cell]).valid, false);
  assert.ok(build(city, 'bulldoze', [b.cell]).valid); assert.equal(city.cells[b.cell].building, null);
  place(city, 'bulldoze', 13, 21, 14, 22);
  assert.equal(city.cells.filter(c => c.facility != null).length, 4);
  assert.doesNotThrow(() => deserialize(serialize(city)));
});
test('saving, loading, continuing and saving again preserves deterministic state', () => {
  const original = town(); advance(original, 170);
  const saved = serialize(original, '2026-10-01T00:00:00.000Z'), loaded = deserialize(saved).city;
  assert.deepEqual(loaded, original);
  advance(original, 50); advance(loaded, 50); assert.deepEqual(loaded, original);
  const loadedAgain = deserialize(serialize(loaded)).city; assert.deepEqual(loadedAgain, original);
  assert.deepEqual([...measure(loadedAgain).flow], [...measure(original).flow]);
});
test('corruption, future versions, nonfinite values and bad references are rejected', () => {
  const city = town(); advance(city, 30); const save = serialize(city);
  assert.throws(() => deserialize('not JSON'), /JSON/);
  assert.throws(() => deserialize(save.replace('Willow Bay', 'Damaged Bay')), /checksum/);
  const envelope = JSON.parse(save); envelope.version = 99; assert.throws(() => deserialize(JSON.stringify(envelope)), /version/);
  city.treasury = NaN; assert.throws(() => serialize(city), /invalid/); city.treasury = 1000;
  city.cells[at(30, 30)].building = 999; assert.throws(() => serialize(city), /invalid/);
});
test('checksum-valid malicious schema errors are rejected before simulation', () => {
  const envelope = JSON.parse(serialize(town())); const city = JSON.parse(envelope.payload);
  city.facilities[0].cells = [1, 2, 3, 4]; envelope.payload = JSON.stringify(city); envelope.checksum = hashSeed(envelope.payload).toString(16);
  assert.throws(() => deserialize(JSON.stringify(envelope)), /invalid/);
});
test('utility capacity bounds development and construction reserves are honored', () => {
  const city = createCity({ terrain: 'plains', difficulty: 'relaxed' });
  for (let y = 15; y <= 35; y += 3) place(city, 'road', 15, y, 34, y);
  place(city, 'road', 15, 15, 15, 35); place(city, 'wind', 16, 16); place(city, 'water', 19, 16);
  for (let y = 16; y <= 34; y++) for (let x = 16; x <= 34; x++) {
    if (city.cells[at(x, y)].road || city.cells[at(x, y)].facility != null) continue;
    place(city, x < 24 ? 'residential' : 'industrial', x, y);
  }
  advance(city, 500); const m = measure(city);
  assert.ok(m.powerDemand <= m.power); assert.ok(m.waterDemand <= m.water);
  assert.ok(city.cells.some(c => c.zone && c.building == null));
});
test('long-running extreme taxation and debt preserve finite bounded state', () => {
  const city = town(); city.treasury = 0;
  for (const type of Object.keys(city.taxes)) city.taxes[type] = 0;
  advance(city, 1200); assert.ok(city.treasury < 0);
  for (const type of Object.keys(city.taxes)) city.taxes[type] = 20;
  advance(city, 1200);
  assert.ok(city.buildings.every(b => b.occupants >= 0 && b.occupants <= 18));
  assert.ok(Object.values(city.demand).every(d => d >= -100 && d <= 100));
  assert.doesNotThrow(() => serialize(city)); assert.ok(city.history.length <= 240);
});
