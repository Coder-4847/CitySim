import test from 'node:test';
import assert from 'node:assert/strict';
import { createCity } from '../src/simulation/world.js';
import { advance } from '../src/simulation/city.js';
import { measure } from '../src/simulation/metrics.js';
import { serialize, deserialize } from '../src/simulation/save.js';
import { startFire } from '../src/simulation/incidents.js';
import { upgradeRequirements } from '../src/simulation/evolution.js';
import { capacity, buildingDefaults, utilityNeed, hashSeed } from '../src/simulation/rules.js';
import { build } from '../src/simulation/build.js';
import { place, at, town } from './fixtures.mjs';

function parcel(city,type,x,y,occupants=0) {
  const id=city.nextId++,cell=at(x,y);
  Object.assign(city.cells[cell],{zone:type,building:id,tree:false});
  const b=buildingDefaults({id,cell,type,level:1,variant:id%8,progress:1,duration:12,occupants,name:`Test ${type} ${id}`});
  city.buildings.push(b); city.revision++; return b;
}
// Constructed civic fixture isolates services from organic construction timing.
function civic(advanced=false) {
  const city=createCity({seed:'civic',terrain:'plains',difficulty:'relaxed'});
  city.milestone=advanced?3:1;
  place(city,'road',10,20,40,20); place(city,'wind',10,21); place(city,'water',13,21);
  for(let x=16;x<=21;x++) parcel(city,'residential',x,21,18);
  for(let x=32;x<=39;x++) parcel(city,'industrial',x,19);
  for(const [type,x,y] of [['park',16,18],['school',19,18],['clinic',22,18],['police',25,21],['fire',28,21],['garbage',36,21]]) assert.ok(place(city,type,x,y).valid,type);
  if(advanced) { assert.ok(place(city,'secondary',25,18).valid); assert.ok(place(city,'university',28,18).valid); }
  return city;
}

test('service buildings unlock at retained population stages and charge real maintenance',()=>{
  const c=createCity({terrain:'plains'});place(c,'road',10,20,30,20);
  assert.equal(place(c,'school',19,18).valid,false); assert.ok(place(c,'park',16,18).valid);
  c.milestone=1;assert.ok(place(c,'school',19,18).valid);assert.equal(place(c,'hospital',22,18).valid,false);
  const m=measure(c);assert.equal(m.serviceExpenses,118);assert.equal(m.facilities.get(c.facilities.find(f=>f.type==='school').id).active,false);
});
test('service coverage follows roads and is removed when its network disconnects',()=>{
  const c=civic(),b=c.buildings[0],before=measure(c).details.get(b.id).coverage.school;
  assert.ok(before>.7);
  place(c,'bulldoze',19,20,20,20);
  assert.equal(measure(c).details.get(b.id).coverage.school,0);
  assert.ok(place(c,'road',19,20,20,20).valid);assert.equal(measure(c).details.get(b.id).coverage.school,before);
});
test('school capacity overload reduces effective coverage instead of multiplying seats',()=>{
  const c=civic(),school=c.facilities.find(f=>f.type==='school'),b=c.buildings[0];
  const initial=measure(c).details.get(b.id).coverage.school;
  for(let x=16;x<=30;x++) for(const y of [19,21]) if(c.cells[at(x,y)].facility==null&&c.cells[at(x,y)].building==null) {const home=parcel(c,'residential',x,y,48);home.level=3;}
  for(const h of c.buildings.filter(b=>b.type==='residential')) {h.level=3;h.occupants=48;}
  const m=measure(c),fd=m.facilities.get(school.id);
  assert.ok(fd.load>fd.capacity);assert.ok(m.details.get(b.id).coverage.school<initial);
  assert.ok(Math.abs(m.details.get(b.id).coverage.school - initial*fd.capacity/fd.load)<.00001);
});
test('parks raise real land value and industrial pollution harms nearby homes',()=>{
  const c=civic(),b=c.buildings[0],initial=measure(c).details.get(b.id);
  place(c,'bulldoze',16,18);const bare=measure(c).details.get(b.id);
  assert.ok(bare.landValue<initial.landValue);assert.ok(bare.desirability<initial.desirability);
  parcel(c,'industrial',16,19);const dirty=measure(c).details.get(b.id);
  assert.ok(dirty.landValue<bare.landValue);assert.ok(dirty.health<bare.health);assert.ok(measure(c).fields.pollution[b.cell]>0);
});
test('ground pollution accumulates, persists after demolition, and decays over time',()=>{
  const c=civic(),source=c.buildings.find(b=>b.type==='industrial'),i=source.cell;
  advance(c,80);const contaminated=c.ground[i];assert.ok(contaminated>5);
  build(c,'bulldoze',c.buildings.filter(b=>b.type==='industrial').map(b=>b.cell));place(c,'bulldoze',36,21);
  assert.equal(c.ground[i],contaminated);assert.equal(measure(c).fields.pollution[i],0);
  advance(c,80);assert.ok(c.ground[i]<contaminated);assert.ok(c.ground[i]>0);
});
test('garbage collection and education evolve gradually and service removal reverses improvement',()=>{
  const c=civic(),b=c.buildings[0];b.waste=.8;
  advance(c,180);assert.ok(b.waste<.05);assert.ok(b.education>.3);assert.ok(b.education<.6);
  place(c,'bulldoze',36,21);place(c,'bulldoze',19,18);const education=b.education;
  advance(c,80);assert.ok(b.waste>.2);assert.ok(b.education<education);
});
test('healthy educated housing upgrades organically and consumes additional utilities',()=>{
  const c=civic(true);advance(c,450);
  const upgraded=c.buildings.filter(b=>b.type==='residential'&&b.level>1);assert.ok(upgraded.length>0);
  assert.ok(upgraded.some(b=>b.level===3),'advanced education and sustained good conditions should enable level 3');
  for(const b of upgraded) {assert.ok(capacity(b)>18);assert.ok(utilityNeed(b,'power')>4);}
  const m=measure(c);assert.ok(m.powerDemand<=m.power);assert.ok(m.waterDemand<=m.water);
  const max={...upgraded[0],level:3};assert.deepEqual(upgradeRequirements(c,max,m.details.get(upgraded[0].id),m),['Maximum level reached']);
  assert.doesNotThrow(()=>serialize(c));
});
test('prolonged utility loss abandons buildings and restored services allow reopening',()=>{
  const c=civic(),ids=c.buildings.map(b=>b.id);
  place(c,'bulldoze',10,21);advance(c,100);assert.ok(measure(c).abandoned>=ids.length);
  assert.equal(measure(c).jobs,0);place(c,'wind',10,21);advance(c,150);
  assert.ok(c.buildings.some(b=>ids.includes(b.id)&&b.status!=='abandoned'));assert.ok(measure(c).jobs>0);
});
test('fire response follows actual roads and prevents avoidable damage',()=>{
  const protectedCity=civic(),unprotected=deserialize(serialize(protectedCity)).city;
  place(unprotected,'bulldoze',28,21);
  const id=protectedCity.buildings[0].id;
  assert.ok(startFire(protectedCity,id));assert.ok(startFire(unprotected,id));assert.equal(startFire(protectedCity,id),false);
  assert.ok(measure(protectedCity).routes.some(r=>r.kind==='fire'));
  advance(protectedCity,50);advance(unprotected,50);
  assert.equal(protectedCity.incidents.length,0);assert.equal(unprotected.incidents.length,0);
  assert.ok(protectedCity.buildings[0].damage<unprotected.buildings[0].damage);
  assert.ok(protectedCity.timeline.some(e=>e.text.includes('contain the fire')));assert.ok(unprotected.timeline.some(e=>e.text.includes('evacuated')));
});
test('demolishing a responding station clears saved incident references immediately',()=>{
  const c=civic();startFire(c,c.buildings[0].id);advance(c,1);assert.ok(c.incidents[0].responderId);
  place(c,'bulldoze',28,21);assert.equal(c.incidents[0].responderId,null);assert.doesNotThrow(()=>deserialize(serialize(c)));
  build(c,'bulldoze',[c.buildings[0].cell]);assert.equal(c.incidents.length,0);assert.doesNotThrow(()=>serialize(c));
});
test('congestion slows service response and reduces business productivity and tax revenue',()=>{
  const c=civic(),quiet=measure(c),factory=c.buildings.find(b=>b.type==='industrial');
  const quietProductivity=quiet.details.get(factory.id).productivity;
  for(let x=22;x<=31;x++) if(c.cells[at(x,19)].facility==null&&c.cells[at(x,19)].building==null) {const b=parcel(c,'residential',x,19,48);b.level=3;}
  for(const b of c.buildings.filter(b=>b.type==='residential')) { b.level=3;b.occupants=48; }
  c.revision++;
  const congested=measure(c);
  assert.ok(congested.averageDelay>quiet.averageDelay);assert.ok(congested.fields.noise.some(v=>v>0));
  assert.ok(congested.details.get(factory.id).productivity<quietProductivity);
  assert.ok(congested.incomeByType.industrial/congested.employed < quiet.incomeByType.industrial/quiet.employed);
  startFire(c,c.buildings[0].id);advance(c,1);const busyArrival=c.incidents[0].arrival;
  const clear=civic();startFire(clear,clear.buildings[0].id);advance(clear,1);
  assert.ok(busyArrival>clear.incidents[0].arrival);
});
test('service vehicles follow municipal routes rather than cosmetic random movement',()=>{
  const c=civic();c.day=1;c.buildings[0].waste=.4;const m=measure(c);
  assert.ok(m.routes.some(r=>r.kind==='garbage'));assert.ok(m.routes.some(r=>r.kind==='police'));
  for(const r of m.routes) for(const i of r.path) assert.ok(c.cells[i].road);
});
test('measurement is read-only and saved civic fields reproduce exactly after continuation',()=>{
  const c=civic(true);advance(c,95);startFire(c,c.buildings[0].id);
  const before=JSON.stringify(c);measure(c);assert.equal(JSON.stringify(c),before);
  const loaded=deserialize(serialize(c)).city;advance(c,100);advance(loaded,100);assert.deepEqual(loaded,c);
  assert.deepEqual([...measure(loaded).fields.landValue],[...measure(c).fields.landValue]);
});
test('version 1 saves migrate while retaining budget, geometry, time, and RNG',()=>{
  const c=town();advance(c,50);const legacy=structuredClone(c);legacy.version=1;
  delete legacy.revision;delete legacy.ground;delete legacy.incidents;
  for(const b of legacy.buildings) for(const k of ['education','waste','damage','goodDays','badDays','status']) delete b[k];
  const payload=JSON.stringify(legacy),envelope={format:'CitySim',version:1,savedAt:'2026-10-01T00:00:00Z',payload,checksum:hashSeed(payload).toString(16)};
  const migrated=deserialize(JSON.stringify(envelope)).city;
  for(const k of ['treasury','day','rng','nextId','ledger']) assert.deepEqual(migrated[k],legacy[k]);
  legacy.cells.forEach((cell,i)=>{for(const key of Object.keys(cell)) assert.deepEqual(migrated.cells[i][key],cell[key]);});
  assert.equal(migrated.version,5);assert.equal(migrated.ground.length,3136);assert.ok(migrated.buildings.every(b=>b.education===.15));
  assert.doesNotThrow(()=>deserialize(serialize(migrated)));
});
test('checksum-valid invalid civic states are rejected before loading',()=>{
  const c=civic();startFire(c,c.buildings[0].id);
  for(const mutate of [x=>x.ground.pop(),x=>x.ground[0]=-1,x=>x.buildings[0].level=4,x=>x.buildings[0].waste=2,x=>x.incidents[0].buildingId=9999,x=>x.incidents[0].responderId=9999,x=>x.buildings[0].type='toString',x=>x.facilities[0].type='constructor']) {
    const broken=structuredClone(c);mutate(broken);const payload=JSON.stringify(broken);
    assert.throws(()=>deserialize(JSON.stringify({format:'CitySim',version:2,savedAt:'2026-10-01',payload,checksum:hashSeed(payload).toString(16)})),/invalid/);
  }
});
test('a service touching two disconnected streets cannot supply its other road component',()=>{
  const c=civic(),home=parcel(c,'residential',18,17,18);
  place(c,'road',19,17,21,17);place(c,'wind',18,15);place(c,'water',21,15);
  const m=measure(c),d=m.details.get(home.id),mainHome=c.buildings[0],school=c.facilities.find(f=>f.type==='school');
  assert.equal(m.facilities.get(school.id).active,true);
  assert.ok(d.power>.95);assert.ok(d.coverage.school>.7);
  assert.equal(m.details.get(mainHome.id).coverage.school,0);assert.equal(m.fields.school[mainHome.cell],0);
});
test('healthcare and police reduce local health and crime risks with operational coverage',()=>{
  const c=civic(),b=c.buildings[0],healthy=measure(c).details.get(b.id);
  assert.ok(healthy.coverage.healthcare>0);assert.ok(healthy.coverage.police>0);
  place(c,'bulldoze',22,18);place(c,'bulldoze',25,21);const unserved=measure(c).details.get(b.id);
  assert.ok(unserved.health<healthy.health);assert.ok(unserved.crime>healthy.crime);
});
