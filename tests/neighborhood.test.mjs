import test from 'node:test';
import assert from 'node:assert/strict';
import { createCity } from '../src/simulation/world.js';
import { build,selection } from '../src/simulation/build.js';
import { measure } from '../src/simulation/metrics.js';
import { advance } from '../src/simulation/city.js';
import { developmentNeeds } from '../src/simulation/development.js';
import { VehicleFleet,lanePosition,VEHICLE_GAP } from '../src/render/vehicles.js';
import { town,place,at } from './fixtures.mjs';

test('zoning across streets, water, and occupied land paints only eligible parcels at their actual cost',()=>{
  const c=town();advance(c,50);const beforeRoads=c.cells.filter(c=>c.road).length;
  const facilities=JSON.stringify(c.facilities),buildings=JSON.stringify(c.buildings);
  c.cells[at(26,21)].terrain='water';const treasury=c.treasury;
  const r=build(c,'residential',selection(c,at(10,19),at(27,22),'residential'));
  assert.ok(r.valid);assert.ok(r.skipped>0);assert.equal(treasury-c.treasury,r.changes.length*8);
  assert.equal(c.cells[at(26,21)].zone,null);assert.equal(c.cells.filter(c=>c.road).length,beforeRoads);
  assert.equal(JSON.stringify(c.facilities),facilities);assert.equal(JSON.stringify(c.buildings),buildings);
  assert.ok(r.changes.every(i=>c.cells[i].zone==='residential'&&!c.cells[i].road&&c.cells[i].building==null));
});
test('empty housing explains missing infrastructure and grows after its requirements are supplied',()=>{
  const c=createCity({terrain:'plains',seed:'test-town'}),i=at(18,21);
  place(c,'residential',18,21);assert.equal(developmentNeeds(c,i,measure(c)).length,3);
  place(c,'road',10,20,25,20);assert.equal(developmentNeeds(c,i,measure(c)).length,2);
  place(c,'wind',10,21);place(c,'water',13,21);place(c,'industrial',18,19,24,19);
  assert.deepEqual(developmentNeeds(c,i,measure(c)),[]);advance(c,60);
  assert.ok(c.cells[i].building!=null);assert.ok(c.buildings.find(b=>b.cell===i).occupants>0);
});
test('traffic uses the actual map width and stays continuous through turns',()=>{
  const path=[11,12,22,32],size=10;
  const p=lanePosition(path,.5,size);assert.ok(p.x>1&&p.x<2&&p.y>=1&&p.y<1.5);
  for(const d of [1,2]){const a=lanePosition(path,d-.00001,size),b=lanePosition(path,d+.00001,size);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.0001);}
});
test('visual vehicles keep spacing, stop when paused, and disappear from demolished routes',()=>{
  const c=town();const east=Array.from({length:21},(_,n)=>at(10+n,20));
  const routes=[{kind:'commute',volume:10,path:east},{kind:'freight',volume:4,path:east},{kind:'bus',volume:1,path:[...east].reverse()}];
  const fleet=new VehicleFleet();let cars=fleet.update(c,routes,0);assert.equal(cars.length,3);
  for(let n=0;n<600;n++){
    cars=fleet.update(c,routes,1/30);
    for(let a=0;a<cars.length;a++)for(let b=a+1;b<cars.length;b++)assert.ok(Math.hypot(cars[a].x-cars[b].x,cars[a].y-cars[b].y)>=VEHICLE_GAP-1e-9);
    assert.ok(cars.every(car=>c.cells[car.cell].road&&c.cells[car.next].road));
  }
  const positions=cars.map(c=>[c.x,c.y]);assert.deepEqual(fleet.update(c,routes,0).map(c=>[c.x,c.y]),positions);
  build(c,'bulldoze',[at(20,20)]);assert.equal(fleet.update(c,routes,.1).length,0);
});
test('fully transit-served commutes and invalid road jumps cannot spawn cars',()=>{
  const c=town(),fleet=new VehicleFleet();
  assert.equal(fleet.update(c,[{kind:'commute',volume:10,roadVolume:0,path:[at(10,20),at(11,20)]},{kind:'freight',volume:1,path:[at(10,20),at(20,20)]}],.1).length,0);
});
test('crossing traffic yields at junctions and both directions make progress without overlap',()=>{
  const c=town();place(c,'road',20,15,20,25);
  const east=Array.from({length:11},(_,n)=>at(15+n,20)),south=Array.from({length:11},(_,n)=>at(20,15+n));
  const routes=[{kind:'commute',volume:10,path:east},{kind:'freight',volume:2,path:south}];
  const fleet=new VehicleFleet(),passed=new Set();
  for(let n=0;n<500;n++){
    const cars=fleet.update(c,routes,1/30);
    for(const car of cars)if(car.distance>7)passed.add(car.vehicleKind);
    assert.equal(cars.length,2);assert.ok(Math.hypot(cars[0].x-cars[1].x,cars[0].y-cars[1].y)>=VEHICLE_GAP-1e-9);
  }
  assert.equal(passed.size,2);
});
