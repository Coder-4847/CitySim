import { neighbors } from '../simulation/rules.js';
import { permits, roadRule, travelDelay } from './roads.js';

const caches = new WeakMap();
export function graphFor(city) {
  let graph = caches.get(city);
  if (graph && graph.revision === city.graphRevision) return graph;
  const components = new Int32Array(city.cells.length).fill(-1);
  const adjacency = new Map();
  city.cells.forEach((c, i) => { if (c.road) adjacency.set(i, neighbors(i, city.size).filter(j => city.cells[j].road)); });
  let componentCount = 0;
  for (const i of adjacency.keys()) {
    if (components[i] !== -1) continue;
    const queue = [i]; components[i] = componentCount;
    for (let k = 0; k < queue.length; k++) for (const n of adjacency.get(queue[k])) {
      if (components[n] === -1) { components[n] = componentCount; queue.push(n); }
    }
    componentCount++;
  }
  const outgoing = new Map([...adjacency].map(([i,ns])=>[i,ns.filter(n=>permits(city,i,n))]));
  // Strongly connected road regions define jobs reachable in both directions.
  const seen=new Set(),order=[],reverse=new Map([...outgoing.keys()].map(i=>[i,[]]));
  for(const [i,ns] of outgoing)for(const n of ns)reverse.get(n).push(i);
  for(const root of outgoing.keys())if(!seen.has(root)){
    const stack=[[root,false]];
    while(stack.length){const [i,done]=stack.pop();if(done){order.push(i);continue;}if(seen.has(i))continue;seen.add(i);stack.push([i,true]);for(const n of outgoing.get(i))if(!seen.has(n))stack.push([n,false]);}
  }
  const travelComponents=new Int32Array(city.cells.length).fill(-1);let region=0;
  for(const root of order.reverse())if(travelComponents[root]<0){const stack=[root];travelComponents[root]=region;while(stack.length){for(const n of reverse.get(stack.pop()))if(travelComponents[n]<0){travelComponents[n]=region;stack.push(n);}}region++;}
  graph = { maxSpeed:Math.max(1,...[...adjacency.keys()].map(i=>roadRule(city.cells[i]).speed)), travelComponents, outgoing, revision: city.graphRevision, adjacency, components, componentCount, routes: new Map() };
  caches.set(city, graph);
  return graph;
}
export function accessRoads(city, indices) {
  return [...new Set(indices.flatMap(i => neighbors(i, city.size)).filter(i => city.cells[i].road && city.cells[i].roadType !== 'highway'))];
}
class Heap {
  values=[];
  push(item) { let i=this.values.length;this.values.push(item);while(i){const p=(i-1)>>1;if(this.values[p][0]<=item[0])break;this.values[i]=this.values[p];i=p;}this.values[i]=item; }
  pop() {const root=this.values[0],last=this.values.pop();if(this.values.length){let i=0;while(i*2+1<this.values.length){let c=i*2+1;if(c+1<this.values.length&&this.values[c+1][0]<this.values[c][0])c++;if(this.values[c][0]>=last[0])break;this.values[i]=this.values[c];i=c;}this.values[i]=last;}return root;}
}
export function findRoute(city,start,end,loads=null) {
  const graph=graphFor(city);
  if(!graph.adjacency.has(start)||!graph.adjacency.has(end)||graph.components[start]!==graph.components[end])return null;
  const key=`${start}:${end}`;
  if(!loads&&graph.routes.has(key))return graph.routes.get(key);
  const distance=new Float64Array(city.cells.length).fill(Infinity),previous=new Int32Array(city.cells.length).fill(-1),heap=new Heap();
  const heuristic=i=>(Math.abs(i%city.size-end%city.size)+Math.abs(Math.floor(i/city.size)-Math.floor(end/city.size)))/graph.maxSpeed;
  distance[start]=0;heap.push([heuristic(start),start,0]);
  while(heap.values.length){const [,i,cost]=heap.pop();if(cost!==distance[i])continue;if(i===end)break;
    for(const n of graph.outgoing.get(i)){
      const delay=loads?travelDelay(city,n,loads[n],graph.adjacency.get(n).length):0;
      const next=cost+(1+delay)/roadRule(city.cells[n]).speed;
      if(next<distance[n]){distance[n]=next;previous[n]=i;heap.push([next+heuristic(n),n,next]);}
    }
  }
  let path=null;
  if(Number.isFinite(distance[end])){path=[];for(let i=end;i>=0;i=previous[i])path.push(i);path.reverse();}
  if(!loads){if(graph.routes.size>4000)graph.routes.clear();graph.routes.set(key,path);}
  return path;
}
export function routeFromFacility(city, facility, end) {
  if (!facility || end == null) return null;
  const graph = graphFor(city), component = graph.components[end];
  const routes = accessRoads(city, facility.cells).filter(i => graph.components[i] === component).map(i => findRoute(city,i,end)).filter(Boolean);
  return routes.sort((a,b) => a.length-b.length)[0] || null;
}
