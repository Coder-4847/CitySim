import { graphFor, findRoute } from './graph.js';
import { capacity } from '../simulation/rules.js';

export function freight(city,details) {
  const graph=graphFor(city),gateways=[...graph.adjacency.keys()].filter(i=>i%city.size===0||i%city.size===city.size-1||i<city.size||i>=city.cells.length-city.size);
  const factories=city.buildings.filter(b=>b.type==='industrial'&&details.get(b.id).active),routes=[];
  const trade={gateways:gateways.length,imports:0,exports:0,connectedIndustry:0,disconnectedShops:0};
  const nearest=(from,targets)=>targets.map(to=>findRoute(city,from,to)).filter(Boolean).sort((a,b)=>a.length-b.length)[0];
  for(const b of city.buildings){
    const d=details.get(b.id);d.goodsSupply=1;d.externalAccess=false;
    if(!d.active||!['industrial','commercial'].includes(b.type))continue;
    const out=nearest(d.road,gateways),incoming=gateways.map(g=>findRoute(city,g,d.road)).filter(Boolean).sort((a,b)=>a.length-b.length)[0];
    d.externalAccess=!!(out&&incoming);
    if(b.type==='industrial'){
      if(d.externalAccess){trade.connectedIndustry++;trade.exports+=d.employed*.4;
        if(routes.length<100)routes.push({path:out,volume:d.employed*.12,kind:'freight',buildingId:b.id});}
    }else{
      const local=factories.map(f=>findRoute(city,details.get(f.id).road,d.road)).filter(Boolean).sort((a,b)=>a.length-b.length)[0];
      const path=local||incoming;d.goodsSupply=path?1:.35;
      if(!path)trade.disconnectedShops++;
      else {const units=Math.max(1,capacity(b)*.12);if(!local)trade.imports+=units;if(routes.length<100)routes.push({path,volume:units,kind:'freight',buildingId:b.id});}
    }
  }
  return {routes,trade};
}
