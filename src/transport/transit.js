import { findRoute, accessRoads } from './graph.js';
import { policy } from '../simulation/districts.js';

export function addBusRoute(city,name,stops,buses=2,fare=2) {
  if(city.busRoutes.length>=24)throw new Error('This map supports up to 24 bus routes.');
  if(stops.length<2||stops.length>24||new Set(stops).size!==stops.length||stops.some(i=>!city.cells[i]?.stop))throw new Error('Choose 2–24 different bus stops.');
  if(!Number.isInteger(buses)||buses<1||buses>12||!Number.isFinite(fare)||fare<0||fare>5)throw new Error('Use 1–12 buses and a fare between $0 and $5.');
  for(let n=0;n<stops.length;n++)if(!findRoute(city,stops[n],stops[(n+1)%stops.length]))throw new Error('The stops need a complete directed road loop, including the return trip.');
  const route={id:city.nextId++,name:String(name).trim().slice(0,40)||'New bus route',stops:[...stops],buses,fare,enabled:true};
  city.busRoutes.push(route);city.revision++;return route;
}
export function transit(city,facilities) {
  const depots=city.facilities.filter(f=>f.type==='busDepot'&&facilities.get(f.id).active).map(f=>({roads:accessRoads(city,f.cells),available:12}));
  const fleet=depots.length*12;
  let available=fleet;
  const lines=city.busRoutes.map(route=>{
    const line={...route,path:[],active:false,riders:0,demand:0,capacity:0,revenue:0,reason:route.enabled?'Not enough depot fleet':'Paused'};
    if(!route.enabled)return line;
    if(route.stops.some(i=>!city.cells[i].stop)){line.reason='A stop was removed';return line;}
    for(let n=0;n<route.stops.length;n++){
      const leg=findRoute(city,route.stops[n],route.stops[(n+1)%route.stops.length]);
      if(!leg){line.reason='Road loop is disconnected';return line;}
      line.path.push(...leg.slice(0,-1));
    }
    line.path.push(line.path[0]);
    const reachable=depots.filter(d=>d.roads.some(i=>findRoute(city,i,route.stops[0])&&findRoute(city,route.stops[0],i)));
    if(route.buses>reachable.reduce((s,d)=>s+d.available,0)){line.reason='No reachable depot with enough fleet';return line;}
    let required=route.buses;for(const d of reachable){const assigned=Math.min(required,d.available);d.available-=assigned;required-=assigned;}
    available-=route.buses;line.active=true;line.reason='Running';line.capacity=route.buses*24*Math.min(1,32/Math.max(1,line.path.length));
    return line;
  });
  return {fleet,usedFleet:fleet-available,lines,riders:0,demand:0,revenue:0,expenses:lines.reduce((s,l)=>s+(l.active?l.buses*75:0),0)+city.cells.filter(c=>c.stop).length*2};
}
const walking=(city,a,b)=>Math.abs(a%city.size-b%city.size)+Math.abs(Math.floor(a/city.size)-Math.floor(b/city.size));
export function assignTransit(city,commutes,system) {
  for(const trip of commutes){
    const line=system.lines.find(l=>l.active&&l.stops.some(origin=>walking(city,origin,trip.homeCell)<=3&&l.stops.some(destination=>destination!==origin&&walking(city,destination,trip.workCell)<=3)));
    if(!line)continue;
    trip.line=line;trip.free=policy(city,trip.homeCell,'freeTransit');
    trip.transitDemand=trip.volume*(trip.free||line.fare===0?.8:Math.max(.25,.75-line.fare*.05));line.demand+=trip.transitDemand;
  }
  for(const trip of commutes)if(trip.line){
    const l=trip.line;trip.riders=trip.transitDemand*Math.min(1,l.capacity/Math.max(1,l.demand));
    l.riders+=trip.riders;l.revenue+=trip.riders*(trip.free?0:l.fare)*2;
  }
  for(const l of system.lines){system.riders+=l.riders;system.demand+=l.demand;system.revenue+=l.revenue;}
}
