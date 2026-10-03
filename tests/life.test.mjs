import test from 'node:test';
import assert from 'node:assert/strict';
import { town, place } from './fixtures.mjs';
import { createCity } from '../src/simulation/world.js';
import { advance } from '../src/simulation/city.js';
import { measure } from '../src/simulation/metrics.js';
import { atmosphere, updateLife, districtIdentity } from '../src/simulation/life.js';
import { createDistrict } from '../src/simulation/districts.js';
import { serialize, deserialize } from '../src/simulation/save.js';
import { hashSeed } from '../src/simulation/rules.js';
import { drawAtmosphere } from '../src/render/atmosphere.js';
import { Ambience } from '../src/ui/audio.js';

const envelope=c=>{const payload=JSON.stringify(c);return JSON.stringify({format:'CitySim',version:c.version,savedAt:'2026-10-02T00:00:00Z',payload,checksum:hashSeed(payload).toString(16)});};
test('atmosphere is deterministic, read-only, and supports fixed accessible lighting',()=>{
  const c=createCity();const snapshot=JSON.stringify(c),rng=c.rng;
  assert.deepEqual(atmosphere(c),atmosphere(structuredClone(c)));assert.equal(atmosphere(c,'day').darkness,0);assert.equal(atmosphere(c,'night').darkness,1);
  assert.equal(JSON.stringify(c),snapshot);assert.equal(c.rng,rng);
  const weather=new Set();for(let day=0;day<360;day+=30){c.day=day;weather.add(atmosphere(c).weather);}assert.ok(weather.size>=2);
});
test('news and distinctions reflect city metrics and reports cannot double charge',()=>{
  const c=town();advance(c,150);c.day=180;c.life.lastReport=0;c.treasury=10000;place(c,'park',27,21);const m=measure(c);m.population=120;m.health=.8;m.transit.riders=12;m.transit.revenue=48;
  const before=c.treasury;updateLife(c,m);assert.ok(c.life.honors.includes('transit'));assert.ok(c.life.news.some(n=>n.key==='transit'&&n.text.includes('12')));assert.equal(c.life.festivalUntil,194);assert.equal(before-c.treasury,150);
  const snapshot=JSON.stringify(c.life);updateLife(c,m);assert.equal(JSON.stringify(c.life),snapshot);assert.equal(before-c.treasury,150);
});
test('open days require an active park, enough funds, health, and residents',()=>{
  const c=createCity();c.day=180;const m=measure(c);c.treasury=100000;updateLife(c,m);assert.equal(c.life.festivalUntil,0);assert.equal(c.treasury,100000);
});
test('festival target raises housing interest only during its active period',()=>{
  const a=town(),b=structuredClone(a);a.life.festivalUntil=14;advance(a,1);advance(b,1);assert.ok(a.demand.residential>b.demand.residential);
  const c=town(),d=structuredClone(c);c.day=d.day=14;c.life.festivalUntil=14;advance(c,1);advance(d,1);assert.equal(c.demand.residential,d.demand.residential);
});
test('news is bounded and repeated stories are rate-limited',()=>{
  const c=createCity();const m=measure(c);m.net=-20;for(let day=30;day<=30000;day+=30){c.day=day;updateLife(c,m);}assert.ok(c.life.news.length<=60);const budget=c.life.news.filter(n=>n.key==='budget');for(let i=1;i<budget.length;i++)assert.ok(budget[i].day-budget[i-1].day>=90);
});
test('version 3 migration retains routes and district choices and initializes the journal',()=>{
  const c=town();advance(c,60);createDistrict(c,'North');const old=structuredClone(c);old.version=3;delete old.life;
  const loaded=deserialize(envelope(old)).city;assert.equal(loaded.version,5);assert.deepEqual(loaded.districts,old.districts);assert.deepEqual(loaded.busRoutes,old.busRoutes);assert.deepEqual(loaded.cells,old.cells);assert.deepEqual(loaded.life.news,[]);
  advance(loaded,120);const copy=deserialize(serialize(loaded)).city;advance(copy,65);advance(loaded,65);assert.deepEqual(copy,loaded);
});
test('invalid journal state is rejected even with a valid checksum',()=>{
  const c=createCity();for(const mutate of [x=>x.life.honors=['invented'],x=>x.life.festivalUntil=100,x=>x.life.lastReport=-1,x=>x.life.news=[{day:1,key:'x',text:'Future',cell:null}],x=>x.life.news=[{day:0,key:'x',text:'Bad parcel',cell:99999}]]){const copy=structuredClone(c);mutate(copy);assert.throws(()=>deserialize(envelope(copy)),/invalid/);}
});
test('district identity derives from its actual buildings',()=>{
  const c=town();advance(c,150);const d=createDistrict(c,'Works');for(const b of c.buildings.filter(b=>b.type==='industrial'))c.cells[b.cell].district=d.id;
  const identity=districtIdentity(c,d,measure(c));assert.equal(identity.identity,'Production quarter');assert.ok(identity.buildings>0);assert.equal(identity.population,0);
});

test('atmosphere leaves analytical overlays legible and reduced motion removes moving rain',()=>{
  const c=createCity();while(atmosphere(c).weather!=='Rain')c.day+=30;
  const calls=[];const ctx={fillRect:(...v)=>calls.push(['fill',...v]),beginPath:()=>{},ellipse:()=>{},fill:()=>{},moveTo:()=>calls.push(['rain']),lineTo:()=>{},stroke:()=>{}};
  const camera={width:800,height:600,zoom:1,project:()=>({x:100,y:100})},m={details:new Map()};
  drawAtmosphere(ctx,c,m,{overlay:'traffic',lighting:'night'},camera,0);assert.equal(calls.length,0);
  drawAtmosphere(ctx,c,m,{overlay:'none',lighting:'day',reducedMotion:true},camera,0);assert.ok(calls.length>0);assert.ok(!calls.some(c=>c[0]==='rain'));
  calls.length=0;drawAtmosphere(ctx,c,m,{overlay:'none',lighting:'day',reducedMotion:false},camera,0);assert.equal(calls.filter(c=>c[0]==='rain').length,100);
});
test('ambience starts only after unlock, reuses its nodes, and fades to silence when paused',()=>{
  const previous=globalThis.AudioContext;let instances=0,oscillators=0;const gains=[];
  globalThis.AudioContext=class {constructor(){instances++;this.currentTime=0;this.destination={};}resume(){return Promise.resolve();}createGain(){return {gain:{value:0,setTargetAtTime:v=>gains.push(v)},connect(){}};}createOscillator(){oscillators++;return {frequency:{value:0,setTargetAtTime(){}},connect(){},start(){}};}};
  try{const sound=new Ambience();sound.update(1,0,true);assert.equal(instances,0);sound.unlock();sound.unlock();assert.equal(instances,1);assert.equal(oscillators,3);sound.update(.5,0,true);assert.ok(gains.at(-1)>0);const n=gains.length;sound.update(.5,0,true);assert.equal(gains.length,n);sound.update(.5,0,false);assert.equal(gains.at(-1),0);}finally{if(previous===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=previous;}
});
