import test from 'node:test';
import assert from 'node:assert/strict';
import {createCity} from '../src/simulation/world.js';
import {build} from '../src/simulation/build.js';
import {measure} from '../src/simulation/metrics.js';
import {advance} from '../src/simulation/city.js';
import {evolve} from '../src/simulation/evolution.js';
import {serialize,deserialize} from '../src/simulation/save.js';
import {FACILITIES,ZONING_TOOLS,capacity,hashSeed} from '../src/simulation/rules.js';
import {at,place,town} from './fixtures.mjs';

test('every zone has three increasing-cost, increasing-capacity density tiers with enforced unlocks',()=>{
  for(const zone of ['residential','commercial','industrial','office']){
    const tiers=Object.entries(ZONING_TOOLS).filter(([,r])=>r.zone===zone);
    assert.equal(tiers.length,3);
    const c=createCity({terrain:'plains'});c.treasury=100000;
    for(const [id,r] of tiers){
      if(r.unlock){assert.equal(place(c,id,20,20).valid,false);c.milestone=r.unlock;}
      const before=c.treasury;assert.ok(place(c,id,20,20).valid);assert.equal(before-c.treasury,r.cost);
      assert.equal(c.cells[at(20,20)].density,r.tier);
      if(r.tier>1)assert.ok(r.cost>tiers[r.tier-2][1].cost);
      assert.equal(capacity({type:zone,level:1,density:r.tier}),capacity({type:zone,level:1,density:1})*r.tier);
      c.milestone=0;
    }
  }
});
test('rezoning permits higher density without deleting occupants; redevelopment reserves utility capacity',()=>{
  const c=town();advance(c,60);c.milestone=3;
  const b=c.buildings.find(b=>b.type==='residential');const people=b.occupants;
  assert.ok(build(c,'highResidential',[b.cell]).valid);assert.equal(b.density,1);assert.equal(b.occupants,people);
  assert.equal(build(c,'residential',[b.cell]).valid,false);
  const m=measure(c),d=m.details.get(b.id);b.goodDays=60;b.waste=0;d.desirability=80;d.operable=true;
  const n=m.networks[d.component];n.power=10000;n.water=10000;const old=n.powerDemand;
  evolve(c,m);assert.equal(b.density,3);assert.ok(n.powerDemand>old);
  assert.doesNotThrow(()=>deserialize(serialize(c)));
});
test('powered water works stop in a blackout, while gravity reservoirs remain supplied',()=>{
  const c=createCity({terrain:'plains'});c.milestone=3;c.treasury=100000;
  place(c,'road',10,20,35,20);place(c,'coal',10,21);place(c,'pump',14,21);place(c,'treatment',18,21);place(c,'reservoir',22,21);
  let m=measure(c);assert.equal(m.power,2400);assert.equal(m.water,16200);
  assert.equal(m.utilityExpenses,390+165+410+620);
  const pollution=m.fields.pollution[at(10,21)];assert.ok(pollution>50);
  build(c,'bulldoze',[at(10,21)]);m=measure(c);assert.equal(m.power,0);assert.equal(m.water,9000);
  assert.equal(m.facilities.get(c.facilities.find(f=>f.type==='pump').id).active,false);
});
test('service funding scales real capacity and monthly costs and survives saves',()=>{
  const c=town();c.milestone=3;c.treasury=100000;place(c,'precinct',27,21);
  let m=measure(c);const f=c.facilities.find(f=>f.type==='precinct');
  assert.equal(m.facilities.get(f.id).capacity,3000);
  c.funding.police=1.5;c.revision++;m=measure(c);
  assert.equal(m.facilities.get(f.id).capacity,4500);assert.equal(m.serviceExpenses,480);
  const loaded=deserialize(serialize(c)).city;assert.equal(loaded.funding.police,1.5);
  c.funding.police=Infinity;assert.throws(()=>serialize(c),/invalid city data/);
});
test('all expanded facilities have functional rules and can be constructed and saved',()=>{
  for(const id of ['coal','gas','solar','pump','treatment','reservoir','cityPark','precinct','centralFire','recycling','cityHall']){
    const c=createCity({terrain:'plains'});c.milestone=3;c.treasury=100000;
    place(c,'road',10,20,30,20);place(c,'wind',10,21);place(c,'water',13,21);
    assert.ok(place(c,id,18,21).valid,id);const m=measure(c),f=c.facilities.at(-1);
    assert.ok(m.facilities.get(f.id).active,id);assert.ok(FACILITIES[id].power||FACILITIES[id].water||FACILITIES[id].service);
    assert.doesNotThrow(()=>deserialize(serialize(c)),id);
  }
});
test('version 4 cities migrate unchanged with fully funded departments',()=>{
  const c=town();c.version=4;delete c.funding;const payload=JSON.stringify(c);
  const loaded=deserialize(JSON.stringify({format:'CitySim',version:4,payload,checksum:hashSeed(payload).toString(16),savedAt:'2026-10-03T00:00:00Z'})).city;
  assert.equal(loaded.version,5);assert.deepEqual(loaded.cells,c.cells);assert.deepEqual(loaded.facilities,c.facilities);assert.ok(Object.values(loaded.funding).every(v=>v===1));
});
