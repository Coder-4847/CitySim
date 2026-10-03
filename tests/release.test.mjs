import test from 'node:test';
import assert from 'node:assert/strict';
import { createCity } from '../src/simulation/world.js';
import { build, selection } from '../src/simulation/build.js';
import { findRoute, graphFor } from '../src/transport/graph.js';
import { roadRule } from '../src/transport/roads.js';
import { serialize, deserialize } from '../src/simulation/save.js';
import { advance } from '../src/simulation/city.js';
import { hashSeed } from '../src/simulation/rules.js';
import { town, place, at } from './fixtures.mjs';

test('one-way streets allow perpendicular exits at junctions and corners, but not reverse travel',()=>{
  const c=createCity({terrain:'plains'});place(c,'oneWayE',15,20,20,20);place(c,'oneWayS',20,21,20,25);
  assert.ok(findRoute(c,at(15,20),at(20,25)));assert.equal(findRoute(c,at(20,25),at(15,20)),null);
});
test('bridge construction followed by an upgrade cannot discount the final road class',()=>{
  const c=createCity({terrain:'river'});c.milestone=2;const i=c.cells.findIndex(c=>c.terrain==='water'),start=c.treasury;
  assert.ok(build(c,'road',[i]).valid);assert.ok(build(c,'highway',[i]).valid);assert.equal(start-c.treasury,220*4);
});
test('construction rejects prototype names and invalid selections without mutating money',()=>{
  const c=createCity(),before=JSON.stringify(c);for(const tool of ['constructor','toString','__proto__','unknown'])assert.equal(build(c,tool,[at(15,20)]).valid,false);
  for(const indices of [null,[NaN],[1.5],[-1],[3136]])assert.equal(build(c,'road',indices).valid,false);
  assert.deepEqual(selection(c,NaN,10,'road'),[]);assert.deepEqual(selection(c,1,Infinity,'road'),[]);assert.equal(JSON.stringify(c),before);
});
test('building more than 100 facilities while paused remains immediately saveable',()=>{
  const c=createCity({terrain:'plains',difficulty:'relaxed'});c.treasury=1000000;let count=0;
  for(let y=15;y<50&&count<110;y+=3)for(let x=15;x<50&&count<110;x+=3)if(place(c,'park',x,y).valid)count++;
  assert.equal(count,110);assert.equal(c.timeline.length,100);assert.doesNotThrow(()=>deserialize(serialize(c)));
});
test('A-star weighted route cost matches an independent Dijkstra reference',()=>{
  const c=createCity({terrain:'plains'});c.milestone=2;
  for(let y=15;y<=23;y+=2)place(c,y===19?'avenue':'road',15,y,25,y);
  for(const x of [15,20,25])place(c,'road',x,15,x,23);
  place(c,'oneWayE',16,17,19,17);
  const g=graphFor(c),cost=path=>path.slice(1).reduce((s,i)=>s+1/roadRule(c.cells[i]).speed,0);
  for(const [start,end] of [[at(15,15),at(25,23)],[at(25,17),at(15,21)],[at(20,23),at(19,17)]]){
    const pending=new Set(g.outgoing.keys()),distance=new Map([[start,0]]);
    while(pending.size){let best=null;for(const i of pending)if(best===null||(distance.get(i)??Infinity)<(distance.get(best)??Infinity))best=i;
      const d=distance.get(best)??Infinity;if(!Number.isFinite(d))break;pending.delete(best);
      for(const n of g.outgoing.get(best)){const next=d+1/roadRule(c.cells[n]).speed;if(next<(distance.get(n)??Infinity))distance.set(n,next);}
    }
    assert.ok(Math.abs(cost(findRoute(c,start,end))-distance.get(end))<1e-9);
  }
});
test('malformed entity arrays fail validation with a useful error',()=>{
  const c=town();advance(c,50);for(const key of ['buildings','facilities','timeline','history']){const bad=structuredClone(c);bad[key]=[null];const payload=JSON.stringify(bad);assert.throws(()=>deserialize(JSON.stringify({format:'CitySim',version:4,savedAt:'2026-10-02',payload,checksum:hashSeed(payload).toString(16)})),/invalid city data/);}
});
test('a ten-year simulation stays bounded, saveable, and deterministic after reload',()=>{
  const c=town();advance(c,1800);const loaded=deserialize(serialize(c)).city;advance(c,1800);advance(loaded,1800);
  assert.deepEqual(loaded,c);assert.ok(c.history.length<=240);assert.ok(c.timeline.length<=100);assert.ok(c.life.news.length<=60);assert.ok(Number.isFinite(c.treasury));assert.doesNotThrow(()=>serialize(c));
});
