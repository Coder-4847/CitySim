import test from 'node:test';
import assert from 'node:assert/strict';
import { town, place, at } from './fixtures.mjs';
import { createCity } from '../src/simulation/world.js';
import { build } from '../src/simulation/build.js';
import { advance } from '../src/simulation/city.js';
import { measure } from '../src/simulation/metrics.js';
import { findRoute, accessRoads, graphFor } from '../src/transport/graph.js';
import { travelDelay } from '../src/transport/roads.js';
import { addBusRoute } from '../src/transport/transit.js';
import { createDistrict, effectiveTax } from '../src/simulation/districts.js';
import { serialize, deserialize } from '../src/simulation/save.js';
import { capacity, utilityNeed, hashSeed, buildingDefaults } from '../src/simulation/rules.js';

function workingTown(){const c=town({difficulty:'relaxed'});advance(c,150);c.treasury=100000;c.milestone=2;return c;}
function transitTown(){const c=workingTown();assert.ok(place(c,'busDepot',27,21).valid);for(const x of [16,21,25])assert.ok(place(c,'stop',x,20).valid);addBusRoute(c,'Crosstown',[at(16,20),at(21,20),at(25,20)],4,2);return c;}
const envelope=c=>{const payload=JSON.stringify(c);return JSON.stringify({format:'CitySim',version:c.version,savedAt:'2026-10-02T00:00:00Z',payload,checksum:hashSeed(payload).toString(16)});};

test('road upgrades charge differences, increase capacity, and remain atomic',()=>{
  const c=town(),before=c.treasury;assert.ok(place(c,'avenue',10,20,30,20).valid);assert.equal(before-c.treasury,21*65);
  assert.ok(travelDelay(c,at(20,20),80,2)<.2);
  const snapshot=JSON.stringify(c);c.treasury=0;assert.equal(place(c,'highway',10,20,30,20).valid,false);c.treasury=JSON.parse(snapshot).treasury;assert.equal(JSON.stringify(c),snapshot);
});
test('one-way roads enforce return access without splitting utility networks',()=>{
  const c=town();place(c,'oneWayE',10,20,30,20);
  assert.ok(findRoute(c,at(10,20),at(30,20)));assert.equal(findRoute(c,at(30,20),at(10,20)),null);assert.equal(graphFor(c).componentCount,1);
  place(c,'road',10,20,30,20);assert.ok(findRoute(c,at(30,20),at(10,20)));
});
test('signals reduce saturated junction conflict and highways require frontage streets',()=>{
  const c=town();const i=at(20,20),before=travelDelay(c,i,90,4);place(c,'signal',20,20);assert.ok(travelDelay(c,i,90,4)<before);
  assert.equal(place(c,'highway',10,20,30,20).valid,false);c.milestone=2;assert.ok(place(c,'highway',10,20,30,20).valid);assert.deepEqual(accessRoads(c,[at(20,19)]),[]);
});
test('bus routes attract real commuters, charge fares, and reduce car volume',()=>{
  const c=transitTown(),withBus=measure(c);assert.ok(withBus.transit.riders>0);assert.ok(withBus.transit.revenue>0);assert.ok(withBus.transit.riders<=withBus.transit.lines[0].capacity);const cars=withBus.routes.filter(r=>r.kind==='commute').reduce((s,r)=>s+r.roadVolume,0);
  c.busRoutes[0].enabled=false;c.revision++;const without=measure(c);assert.equal(without.transit.riders,0);assert.ok(without.routes.filter(r=>r.kind==='commute').reduce((s,r)=>s+r.roadVolume,0)>cars);
});
test('missing stops and depot demolition suspend buses and preserve editable routes',()=>{
  const c=transitTown();place(c,'removeStop',21,20);assert.equal(measure(c).transit.lines[0].reason,'A stop was removed');assert.doesNotThrow(()=>serialize(c));place(c,'stop',21,20);place(c,'bulldoze',27,21);assert.equal(measure(c).transit.fleet,0);assert.equal(measure(c).transit.lines[0].active,false);
});
test('depot fleet is allocated once and one-way dead ends reject loop routes',()=>{
  const c=transitTown();addBusRoute(c,'Second',[at(16,20),at(25,20)],9,1);assert.equal(measure(c).transit.usedFleet,4);assert.equal(measure(c).transit.lines[1].active,false);
  place(c,'oneWayE',10,20,30,20);assert.throws(()=>addBusRoute(c,'Broken',[at(16,20),at(25,20)]),/loop/);assert.equal(measure(c).transit.lines[0].active,false);
});
test('district free transit removes fares and relief changes only local taxes',()=>{
  const c=transitTown(),d=createDistrict(c,'Central');build(c,'district',c.buildings.map(b=>b.cell),{districtId:d.id});d.policies.freeTransit=true;d.policies.taxRelief=true;c.revision++;
  const m=measure(c);assert.ok(m.transit.riders>0);assert.equal(m.transit.revenue,0);assert.equal(effectiveTax(c,c.buildings[0]),7);build(c,'districtErase',[c.buildings[0].cell]);assert.equal(effectiveTax(c,c.buildings[0]),9);
});
test('external gateways unlock industry exports and removal loses trade access',()=>{
  const c=workingTown();assert.equal(measure(c).trade.exports,0);place(c,'road',0,20,10,20);const m=measure(c);assert.ok(m.trade.exports>0);assert.ok(m.trade.connectedIndustry>0);assert.ok(m.freightFlow.some(v=>v>0));place(c,'bulldoze',0,20);assert.equal(measure(c).trade.exports,0);
});
test('shops need a directed goods route from factories or a boundary gateway',()=>{
  const c=workingTown();for(const b of [...c.buildings].filter(b=>b.type==='industrial'))build(c,'bulldoze',[b.cell]);const m=measure(c);assert.ok(m.trade.disconnectedShops>0);place(c,'road',0,20,10,20);const connected=measure(c);assert.equal(connected.trade.disconnectedShops,0);assert.ok(connected.trade.imports>0);
});
test('dense zoning doubles capacity and utilities and offices reward education',()=>{
  const c=workingTown();assert.ok(place(c,'denseResidential',28,19).valid);assert.equal(c.cells[at(28,19)].density,2);
  const b=buildingDefaults({id:c.nextId++,cell:at(29,19),type:'office',level:1,variant:1,progress:1,duration:10,occupants:0,name:'Office'});c.cells[b.cell].zone='office';c.cells[b.cell].building=b.id;c.buildings.push(b);c.revision++;
  assert.equal(capacity({...b,density:2}),capacity(b)*2);assert.equal(utilityNeed({...b,density:2},'power'),utilityNeed(b,'power')*2);
  const low=measure(c).details.get(b.id).productivity;for(const home of c.buildings.filter(b=>b.type==='residential'))home.education=1;c.revision++;assert.ok(measure(c).details.get(b.id).productivity>low);
});
test('clean industry policy reduces local air pollution at a productivity cost',()=>{
  const c=workingTown(),factory=c.buildings.find(b=>b.type==='industrial'),before=measure(c),pollution=before.fields.pollution[factory.cell],productivity=before.details.get(factory.id).productivity;
  const d=createDistrict(c,'Clean Works');build(c,'district',c.buildings.filter(b=>b.type==='industrial').map(b=>b.cell),{districtId:d.id});d.policies.cleanIndustry=true;c.revision++;
  const after=measure(c);assert.ok(after.fields.pollution[factory.cell]<pollution);assert.ok(after.details.get(factory.id).productivity<productivity);
});
test('version 2 migrates to version 5 and new transport states continue deterministically',()=>{
  const old=workingTown();old.version=2;delete old.districts;delete old.busRoutes;delete old.taxes.office;delete old.demand.office;for(const h of old.history)delete h.demand.office;
  const loaded=deserialize(envelope(old)).city;assert.equal(loaded.version,5);assert.equal(loaded.taxes.office,9);assert.deepEqual(loaded.busRoutes,[]);
  const c=transitTown();createDistrict(c,'Central');const copy=deserialize(serialize(c)).city;advance(c,40);advance(copy,40);assert.deepEqual(copy,c);
});
test('invalid transport references, road types, and policy fields are rejected',()=>{
  const c=transitTown();createDistrict(c,'Central');for(const mutate of [x=>x.busRoutes[0].stops=[-1,1],x=>x.busRoutes[0].buses=13,x=>x.busRoutes[0].fare=-1,x=>x.cells[at(20,20)].roadType='constructor',x=>x.cells[0].district=99999,x=>x.districts[0].policies.freeTransit='yes']){const copy=structuredClone(c);mutate(copy);assert.throws(()=>deserialize(envelope(copy)),/invalid/);}
});

test('congestion-aware routing takes an available detour',()=>{
  const c=createCity({terrain:'plains'});place(c,'road',15,20,25,20);place(c,'road',15,22,25,22);place(c,'road',15,20,15,22);place(c,'road',25,20,25,22);
  const loads=new Float32Array(c.cells.length);for(let x=16;x<25;x++)loads[at(x,20)]=200;
  const route=findRoute(c,at(15,20),at(25,20),loads);assert.ok(route.includes(at(20,22)));assert.ok(!route.includes(at(20,20)));
});
test('one-way barriers remove unreachable employment and restore it after conversion',()=>{
  const c=workingTown();const before=measure(c).employed;place(c,'oneWayE',10,20,30,20);const m=measure(c);assert.ok(m.employed<before);assert.ok(c.buildings.some(b=>b.type==='residential'&&m.details.get(b.id).reachableJobs===false));place(c,'road',10,20,30,20);assert.equal(measure(c).employed,before);
});
test('an operational depot cannot allocate buses to an isolated road network',()=>{
  const c=transitTown();place(c,'road',15,35,25,35);place(c,'stop',15,35);place(c,'stop',25,35);addBusRoute(c,'Isolated',[at(15,35),at(25,35)],2,2);assert.equal(measure(c).transit.lines[1].active,false);
});
