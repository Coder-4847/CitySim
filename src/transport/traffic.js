import { clamp } from '../simulation/rules.js';
import { graphFor, findRoute } from './graph.js';
import { saturation, travelDelay } from './roads.js';
import { transit, assignTransit } from './transit.js';
import { freight } from './freight.js';

export function traffic(city,details,networks,facilities=new Map()) {
  const graph=graphFor(city),flow=new Float32Array(city.cells.length),freightFlow=new Float32Array(city.cells.length),routes=[];
  const homes=city.buildings.filter(b=>b.type==='residential'&&b.occupants>=1&&details.get(b.id).active).sort((a,b)=>graph.travelComponents[details.get(a.id).road]-graph.travelComponents[details.get(b.id).road]),employers=new Map();
  for(const b of city.buildings)if(b.type!=='residential'&&details.get(b.id).active){const component=graph.travelComponents[details.get(b.id).road];if(!employers.has(component))employers.set(component,[]);employers.get(component).push(b);}
  const stride=Math.max(1,Math.ceil(homes.length/120));
  let groupSize=1;
  for(let h=0;h<homes.length;h+=groupSize){
    const home=homes[h],hd=details.get(home.id),targets=employers.get(graph.travelComponents[hd.road]);
    groupSize=1;while(groupSize<stride&&h+groupSize<homes.length&&graph.travelComponents[details.get(homes[h+groupSize].id).road]===graph.travelComponents[hd.road])groupSize++;
    const group=homes.slice(h,h+groupSize);
    let destination,path,back;
    for(let attempt=0;targets&&attempt<Math.min(targets.length,8);attempt++){
      const candidate=targets[(h*7+attempt)%targets.length],dd=details.get(candidate.id);
      path=findRoute(city,hd.road,dd.road);back=path&&findRoute(city,dd.road,hd.road);
      if(back){destination=candidate;break;}
    }
    for(const b of group)details.get(b.id).reachableJobs=!!destination;
    if(!destination)continue;
    const people=group.reduce((s,b)=>s+b.occupants,0),n=networks[hd.component];
    const volume=people*.55*Math.min(1,n.jobs/Math.max(1,n.workers));
    routes.push({path:[...path,...back.slice(1)],outward:path,back,volume,homeId:home.id,destinationId:destination.id,homeCell:home.cell,workCell:destination.cell,group:group.map(b=>b.id),kind:'commute',riders:0});
  }
  const bus=transit(city,facilities);assignTransit(city,routes,bus);
  const goods=freight(city,details);
  const add=(path,volume,target=flow)=>{for(const i of path)target[i]+=volume;};
  for(const r of routes){r.roadVolume=(r.volume-r.riders)*.5;add(r.path,r.roadVolume);}
  for(const r of goods.routes){r.roadVolume=r.volume;add(r.path,r.volume);add(r.path,r.volume,freightFlow);}
  for(const l of bus.lines)if(l.active)add(l.path,l.buses*.5);
  // Reassign only the busiest 32 sampled commutes; deterministic from current state.
  const busy=routes.filter(r=>r.path.some(i=>saturation(city,i,flow[i],graph.adjacency.get(i).length)>1)).sort((a,b)=>b.roadVolume-a.roadVolume).slice(0,32);
  let rerouted=0;
  for(const r of busy){
    add(r.path,-r.roadVolume);
    const path=findRoute(city,r.outward[0],r.outward.at(-1),flow),back=path&&findRoute(city,r.back[0],r.back.at(-1),flow);
    if(path&&back){if(path.join()!==r.outward.join())rerouted++;r.path=[...path,...back.slice(1)];}
    add(r.path,r.roadVolume);
  }
  routes.push(...goods.routes);
  for(const l of bus.lines)if(l.active)routes.push({path:l.path,kind:'bus',volume:l.buses*.5,lineId:l.id});
  const delay=new Float32Array(city.cells.length);let maxTraffic=0,weightedDelay=0,totalVolume=0;
  for(const i of graph.adjacency.keys()){flow[i]=Math.max(0,flow[i]);const degree=graph.adjacency.get(i).length;maxTraffic=Math.max(maxTraffic,saturation(city,i,flow[i],degree));delay[i]=travelDelay(city,i,flow[i],degree);}
  for(const r of routes){
    r.delay=r.path.reduce((s,i)=>s+delay[i],0)/Math.max(1,r.path.length);
    if(r.kind==='commute'){
      weightedDelay+=r.delay*r.volume;totalVolume+=r.volume;
      for(const id of r.group){details.get(id).commuteDelay=r.delay;details.get(id).transitShare=r.volume?r.riders/r.volume:0;}
      const dd=details.get(r.destinationId);dd.commuteDelay=Math.max(dd.commuteDelay||0,r.delay);
    }
  }
  for(const d of details.values())d.commuteDelay??=d.road!=null?delay[d.road]:0;
  return {flow,freightFlow,delay,routes,transit:bus,trade:goods.trade,rerouted,maxTraffic,averageDelay:totalVolume?weightedDelay/totalVolume:0};
}
