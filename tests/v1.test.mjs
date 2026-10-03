import test from 'node:test';
import assert from 'node:assert/strict';
import {town,place,at} from './fixtures.mjs';
import {advance} from '../src/simulation/city.js';
import {measure} from '../src/simulation/metrics.js';
import {developmentNeeds} from '../src/simulation/development.js';
import {building,buildingShape} from '../src/render/art.js';

test('local offices develop before town unlock without an education gate',()=>{
  const c=town();assert.equal(c.milestone,0);
  assert.ok(place(c,'office',26,21,28,21).valid);
  assert.ok(!developmentNeeds(c,at(26,21),measure(c)).some(s=>/educat/i.test(s)));
  advance(c,90);
  assert.ok(c.buildings.some(b=>b.type==='office'&&b.progress===1));
});

test('larger offices explain their education requirements',()=>{
  const c=town();c.milestone=3;
  for(const [tool,x] of [['mediumOffice',26],['highOffice',27]]){
    assert.ok(place(c,tool,x,21).valid);
    assert.ok(developmentNeeds(c,at(x,21),measure(c)).some(s=>/educat/i.test(s)));
  }
});

test('all building variants render finite geometry and houses stay low rise',()=>{
  let calls=0;
  const ctx=new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:1}):(...args)=>{calls++;for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),String(key));},set:()=>true});
  for(const type of ['residential','commercial','industrial','office'])for(const density of [1,2,3])for(const level of [1,2,3])for(const variant of [0,1,2,3,4,5,6,7]){
    const b={type,density,level,variant,id:1,progress:1};
    for(const progress of [0,.5,1])for(const abandoned of [false,true])building(ctx,{...b,progress,status:abandoned?'abandoned':'active'},100,100,2,true);
    if(type==='residential'&&density===1)assert.ok(buildingShape(b).height<24);
    if(density>1)assert.ok(buildingShape(b).height>buildingShape({...b,density:density-1}).height);
  }
  assert.ok(calls>1000);
});
