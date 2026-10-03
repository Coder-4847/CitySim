// Bounded visual traffic; aggregate simulation remains the source of trip demand.
// Right-hand lanes and a shared reservation check keep moving bodies separated.
export const VEHICLE_GAP=.38;
export function lanePosition(path, distance, size) {
  const segment=Math.min(path.length-2,Math.floor(distance)), f=distance-segment;
  const a=path[segment],b=path[segment+1],ax=a%size,ay=Math.floor(a/size);
  const dx=b%size-ax,dy=Math.floor(b/size)-ay;
  const waypoint=n=>{
    const i=path[n],x=i%size,y=Math.floor(i/size),closed=path[0]===path.at(-1);
    const prev=path[n-1]??(closed?path.at(-2):null),next=path[n+1]??(closed?path[1]:null);
    const incoming=prev==null?null:[x-prev%size,y-Math.floor(prev/size)];
    const outgoing=next==null?null:[next%size-x,Math.floor(next/size)-y];
    const directions=[incoming,outgoing].filter(Boolean);
    return {x:x-directions.reduce((v,d)=>v+d[1],0)/directions.length*.23,y:y+directions.reduce((v,d)=>v+d[0],0)/directions.length*.23};
  };
  const p=waypoint(segment),q=waypoint(segment+1);
  return {x:p.x+(q.x-p.x)*f,y:p.y+(q.y-p.y)*f,dx,dy,cell:a,next:b};
}
export class VehicleFleet {
  constructor(){this.cars=[];this.city=null;this.junctions=[];this.locks=new Map();}
  update(city,routes,dt){
    if(this.city!==city){this.cars=[];this.city=city;this.revision=null;this.locks.clear();}
    if(this.revision!==city.graphRevision){
      this.revision=city.graphRevision;
      this.junctions=city.cells.flatMap((c,i)=>{
        if(!c.road)return [];
        const x=i%city.size,y=Math.floor(i/city.size);
        const degree=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&b>=0&&a<city.size&&b<city.size&&city.cells[b*city.size+a].road).length;
        return degree>=3?[{i,x,y}]:[];
      });this.locks.clear();
    }
    const desired=new Map();
    for(const r of [...routes.filter(r=>r.kind!=='commute'),...routes.filter(r=>r.kind==='commute')]){
      const volume=r.kind==='commute'?(r.roadVolume??r.volume):r.volume;
      if(!(volume>0)||r.path.length<2)continue;
      if(r.path.some((i,n)=>!city.cells[i]?.road || n>0 && Math.abs(i%city.size-r.path[n-1]%city.size)+Math.abs(Math.floor(i/city.size)-Math.floor(r.path[n-1]/city.size))!==1))continue;
      const key=`${r.kind}:${r.path.join(',')}`;
      if(!desired.has(key))desired.set(key,r);
      if(desired.size>=80)break;
    }
    this.cars=this.cars.filter(c=>desired.has(c.key));
    const free=(p,except)=>this.cars.every(c=>c===except||Math.hypot(c.x-p.x,c.y-p.y)>=VEHICLE_GAP);
    for(const [key,r] of desired){
      const existing=this.cars.find(c=>c.key===key);
      if(existing){existing.route=r;continue;}
      // Spread initial traffic along genuine trips; blocked spawn points wait.
      for(let d=0;d<r.path.length-1;d+=.8){
        const p=lanePosition(r.path,d,city.size);
        if(free(p)&&this.junctions.every(j=>Math.hypot(j.x-p.x,j.y-p.y)>.85)){this.cars.push({key,route:r,distance:d,...p});break;}
      }
    }
    // Substeps prevent tunnelling when the rendering frame stalls.
    const elapsed=Math.min(.1,Math.max(0,dt)), steps=Math.ceil(elapsed/.02);
    for(let step=0;step<steps;step++)for(const c of this.cars){
      for(const [i,owner] of this.locks)if(!this.cars.includes(owner)||Math.hypot(owner.x-i%city.size,owner.y-Math.floor(i/city.size))>.95)this.locks.delete(i);
      let distance=c.distance+elapsed/steps*1.15/(1+(c.route.delay||0));
      if(distance>=c.route.path.length-1)distance=0;
      const p=lanePosition(c.route.path,distance,city.size);
      const entering=this.junctions.filter(j=>Math.hypot(j.x-p.x,j.y-p.y)<.85);
      if(entering.some(j=>this.locks.has(j.i)&&this.locks.get(j.i)!==c))continue;
      if(free(p,c)){for(const j of entering)this.locks.set(j.i,c);Object.assign(c,p);c.distance=distance;}
    }
    return this.cars.map((c,n)=>({...c,kind:'vehicle',vehicleKind:c.route.kind,variant:n}));
  }
}
