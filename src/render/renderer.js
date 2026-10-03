import { atmosphere } from '../simulation/life.js';
import { VehicleFleet } from './vehicles.js';
import { drawAtmosphere } from './atmosphere.js';
import { roadRule } from '../transport/roads.js';
import { coordinates, neighbors, ROAD_CAPACITY, ZONES, clamp, capacity } from '../simulation/rules.js';
import { LAYERS } from '../ui/layers.js';
import { graphFor } from '../transport/graph.js';
import { diamond, polygon, tree, building, buildingShape, facility, box } from './art.js';

export class Renderer {
  constructor(canvas, camera) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.camera = camera; this.visible = 0;
    this.fleet = new VehicleFleet();
    this.scene = document.createElement('canvas'); this.sceneContext = this.scene.getContext('2d');
  }
  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (this.canvas.width !== w * ratio || this.canvas.height !== h * ratio) { this.canvas.width = w * ratio; this.canvas.height = h * ratio; }
    this.ratio = ratio; this.camera.width = w; this.camera.height = h;
  }
  draw(city, metrics, view, time) {
    this.resize();
    const ctx = this.ctx, cam = this.camera, z = cam.zoom;
    const dt=this.lastVehicleTime==null?0:time-this.lastVehicleTime;this.lastVehicleTime=time;
    this.trafficObjects=this.fleet.update(city,metrics.routes,view.trafficPaused||view.reducedMotion?0:dt);
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    const sceneKey = [cam.width, cam.height, this.ratio, cam.x.toFixed(2), cam.y.toFixed(2), z.toFixed(4),
      city.graphRevision, city.buildings.length, view.overlay, view.debug, view.reducedMotion,
      view.inspected, view.preview?.valid, view.preview?.indices.join(',')].join('|');
    // Environmental motion updates at 12.5 Hz; cars and camera still render every frame.
    // Cache the scene before vehicles, with state/camera/preview changes invalidating it.
    if (this.sceneKey === sceneKey && this.sceneMetrics === metrics && (view.reducedMotion || time - this.sceneTime < .08)) {
      ctx.drawImage(this.scene, 0, 0, cam.width, cam.height);
      this.drawObjects(city,metrics,view,time,ctx,this.sceneObjects||[]);
      drawAtmosphere(ctx,city,metrics,view,cam,time);
      this.debug(city, view);
      return;
    }
    ctx.fillStyle = '#d9e1cf'; ctx.fillRect(0, 0, cam.width, cam.height);
    const buildings=new Map(city.buildings.map(b=>[b.id,b])), facilities=new Map(city.facilities.map(f=>[f.id,f]));
    const objects = [], graph = graphFor(city), selected = new Set(view.preview?.changes || view.preview?.indices || []);
    this.hitTargets = [];
    this.visible = 0;
    for (let diagonal = 0; diagonal < city.size * 2; diagonal++) for (let x = Math.max(0, diagonal - city.size + 1); x <= Math.min(city.size - 1, diagonal); x++) {
      const y = diagonal - x, i = y * city.size + x, c = city.cells[i], p = cam.project(x, y, c.elevation);
      if (p.x < -90 * z || p.x > cam.width + 90 * z || p.y < -30 * z || p.y > cam.height + 130 * z) continue;
      this.visible++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(z, z); ctx.lineWidth = .6;
      let color = c.terrain === 'water' ? ['#70b8c5', '#78c2cb', '#84cbd0'][c.variant % 3] : c.terrain === 'rock' ? '#aeb3a2' : ['#adc998', '#b3cea0', '#acc698', '#bbd3a6', '#abc395', '#bed5ab', '#b2cca0'][c.variant];
      if (c.elevation) { polygon(ctx, [[-24, 0], [0, 12], [0, 12 + c.elevation * 5], [-24, c.elevation * 5]], '#98a68b'); polygon(ctx, [[0, 12], [24, 0], [24, c.elevation * 5], [0, 12 + c.elevation * 5]], '#899982'); }
      diamond(ctx, 0, 0, 24, 12, color, view.debug ? '#a2b297' : null);
      if (c.terrain === 'water') {
        ctx.strokeStyle = '#c1ddda66'; ctx.lineWidth = 1;
        const shift = Math.sin(time * .9 + x * .8 + y) * 3;
        ctx.beginPath(); ctx.moveTo(-8 + shift, -1); ctx.lineTo(2 + shift, 4); ctx.stroke();
      } else if (!c.road && !c.tree && c.variant % 3 === 0) {
        ctx.fillStyle = '#7c996b55'; ctx.fillRect(-6, 1, 2, 1); ctx.fillRect(7, -2, 2, 1);
      }
      if (c.zone) {
        diamond(ctx, 0, 0, 23, 11.5, `${ZONES[c.zone].color}${view.overlay === 'zoning' ? 'dd' : c.building==null?'99':'44'}`, `${ZONES[c.zone].color}bb`);
        if(c.building==null){ctx.setLineDash([3,3]);diamond(ctx,0,0,19,9.5,null,'#fffde9aa');ctx.setLineDash([]);}
      }
      if (c.road) {
        if (c.terrain === 'water') { box(ctx, 0, 1, 24, 12, 3, ['#687d7e', '#bdc3b3', '#7b9294']); }
        const wide=['avenue','highway'].includes(c.roadType), asphalt=c.roadType==='highway'?'#52696e':'#697b79';
        diamond(ctx, 0, 0, 24, 12, '#bec5b3'); diamond(ctx, 0, 0, wide?23:20, wide?11.5:10, asphalt);
        for (const n of neighbors(i, city.size).filter(n => city.cells[n].road)) {
          const [nx, ny] = coordinates(n, city.size), ex = (nx - x - (ny - y)) * 24, ey = (nx - x + ny - y) * 12;
          ctx.strokeStyle = asphalt; ctx.lineWidth = wide?22:17; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ex / 2, ey / 2); ctx.stroke();
          ctx.strokeStyle = '#d7d7b577'; ctx.lineWidth = .8; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ex / 2, ey / 2); ctx.stroke(); ctx.setLineDash([]);
        }
        const rule=roadRule(c);
        if(rule.dx!=null){const ax=(rule.dx-rule.dy)*7,ay=(rule.dx+rule.dy)*3.5;ctx.strokeStyle='#fff1b7';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-ax,-ay);ctx.lineTo(ax,ay);ctx.lineTo(ax*.25-ay,ay*.25+ax*.3);ctx.moveTo(ax,ay);ctx.lineTo(ax*.25+ay,ay*.25-ax*.3);ctx.stroke();}
        if(wide){ctx.fillStyle='#dfd4a4';ctx.fillRect(-2,-1,4,2);}
        if(c.stop){ctx.fillStyle='#326c9b';ctx.fillRect(9,-10,3,10);ctx.fillStyle='#e7f2ed';ctx.fillRect(8,-13,6,5);}
        if(c.signal){ctx.fillStyle='#344a44';ctx.fillRect(-12,-12,3,9);ctx.fillStyle='#e6bc64';ctx.fillRect(-12,-11,3,3);}
      }
      if (view.overlay !== 'none') {
        let heat = null;
        if (view.overlay === 'traffic' && c.road) heat = clamp(metrics.flow[i] / roadRule(c).capacity);
        if (view.overlay === 'population' && c.building != null) { const b = buildings.get(c.building); if (b?.type === 'residential') heat = 1 - b.occupants / capacity(b); }
        if(view.overlay==='freight'&&c.road)heat=clamp(metrics.freightFlow[i]/20);
        if(view.overlay==='districts'&&c.district!=null)diamond(ctx,0,0,23,11.5,`hsla(${c.district*137.5%360},55%,52%,.5)`);
        if(view.overlay==='transit'&&c.stop)diamond(ctx,0,0,23,11.5,'#438ab5aa');
        const layer = LAYERS[view.overlay];
        if (layer && c.terrain === 'land') { const value = clamp(metrics.fields[view.overlay][i] / layer.max); heat = layer.bad ? value : 1 - value; }
        if (view.overlay === 'power' || view.overlay === 'water') {
          const road = c.road ? i : neighbors(i, city.size).find(n => city.cells[n].road);
          const component = c.facility != null ? metrics.facilities.get(c.facility)?.component : road != null ? graph.components[road] : -1;
          const n = metrics.networks[component];
          if (c.road || c.zone || c.facility != null) heat = n ? 1 - clamp(n[view.overlay] / Math.max(1, n[view.overlay + 'Demand'])) : 1;
        }
        if (heat != null) diamond(ctx, 0, 0, 23, 11.5, `hsla(${(1 - heat) * 130}, 57%, 52%, .70)`);
      }
      if (selected.has(i)) diamond(ctx, 0, 0, 23, 11.5, view.preview.valid ? '#ecf2cf66' : '#dd686666', view.preview.valid ? '#ffffe6' : '#b63232');
      if (view.inspected === i) { ctx.lineWidth = 2; diamond(ctx, 0, 0, 23, 11.5, '#fffbe533', '#fff9d8'); }
      ctx.restore();
      if (c.tree && !c.road && c.facility == null && c.building == null) objects.push({ kind: 'tree', x, y, elevation: c.elevation, variant: c.variant });
      if (c.building != null) objects.push({ kind: 'building', id: c.building, x, y });
      if (c.facility != null) {
        const f = facilities.get(c.facility);
        if (f && i === Math.max(...f.cells)) objects.push({ kind: 'facility', f, x: x - .5, y: y - .5 });
      }
    }
    if(view.overlay==='transit')for(const line of metrics.transit.lines)if(line.active){ctx.strokeStyle='#d2a443';ctx.lineWidth=3*z;ctx.beginPath();line.path.forEach((i,n)=>{const p=cam.project(i%city.size,Math.floor(i/city.size));if(n)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();}
    if (this.scene.width !== this.canvas.width || this.scene.height !== this.canvas.height) {
      this.scene.width = this.canvas.width; this.scene.height = this.canvas.height;
    }
    this.sceneContext.drawImage(this.canvas, 0, 0);
    this.sceneKey = sceneKey; this.sceneMetrics = metrics; this.sceneTime = time;
    this.sceneObjects=objects;
    this.drawObjects(city,metrics,view,time,ctx,objects);
    drawAtmosphere(ctx,city,metrics,view,cam,time);
    this.debug(city, view);
  }
  drawObjects(city,metrics,view,time,ctx,objects){
    const cam=this.camera,z=cam.zoom,buildings=new Map(city.buildings.map(b=>[b.id,b]));
    this.hitTargets=[];
    for (const o of [...objects,...this.trafficObjects].sort((a,b)=>(a.x+a.y)-(b.x+b.y))) {
      const p = cam.project(o.x, o.y, o.elevation || 0);
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(z, z);
      if (LAYERS[view.overlay] && o.kind !== 'tree') ctx.globalAlpha = .72;
      if(o.kind === 'vehicle') {this.drawVehicle(ctx,o,time);}
      else if (o.kind === 'tree') tree(ctx, 0, 0, o.variant, time);
      else if (o.kind === 'building') {
        const b = buildings.get(o.id); building(ctx, b, 0, 0, time,view.overlay==='none'&&atmosphere(city,view.lighting).darkness>.3&&metrics.details.get(b.id)?.active);
        const shape=buildingShape(b),height=shape.height,w=shape.width;
        const h=b.progress<1?4+b.progress*height:height+shape.roof;
        this.hitTargets.push({ cell: b.cell, points: [[-w,-h],[0,-h-w/2],[w,-h],[w,0],[0,w/2],[-w,0]].map(([x,y]) => [p.x+x*z,p.y+y*z]) });
        const d = metrics.details.get(b.id);
        if (city.incidents.some(i => i.buildingId === b.id)) {
          ctx.globalAlpha = 1;
          for (let n = 0; n < 3; n++) polygon(ctx, [[n*5-9, -height+5],[n*5-6,-height-8-Math.sin(time*7+n)*4],[n*5-2,-height+5]], n % 2 ? '#ffe099' : '#e57842');
        }
        if (d && (!d.connected || d.power < .95 || d.water < .95)) { ctx.fillStyle = '#d38a54'; ctx.fillRect(-3, -height-16, 7, 8); ctx.fillStyle = '#fff2d3'; ctx.fillRect(0, -height-14, 1, 3); ctx.fillRect(0, -height-10, 1, 1); }
      } else {
        facility(ctx, o.f, 0, 0, time);
        const fh = o.f.type === 'wind' ? 83 : o.f.type === 'water' ? 60 : o.f.type === 'park' ? 20 : 36;
        this.hitTargets.push({ cell: o.f.cells[0], points: [[-30,-fh],[25,-fh],[40,5],[0,20],[-39,0]].map(([x,y]) => [p.x+x*z,p.y+y*z]) });
      }
      ctx.restore();
    }
  }
  debug(city, view) {
    if (view.debug) {
      const ctx = this.ctx, cam = this.camera, graph = graphFor(city);
      const debugX = cam.width / 2 - 125;
      ctx.fillStyle = '#162e37dd'; ctx.fillRect(debugX, 115, 250, 72); ctx.fillStyle = '#e9efd9'; ctx.font = '12px monospace';
      ctx.fillText(`${Math.round(view.fps || 0)} FPS · ${view.tickMs?.toFixed(2) || 0} ms/tick`, debugX + 12, 137);
      ctx.fillText(`${this.visible} visible · ${city.buildings.length} buildings`, debugX + 12, 156);
      ctx.fillText(`${graph.componentCount} networks · ${graph.routes.size} cached routes`, debugX + 12, 175);
    }
  }
  pickObject(x, y) {
    for (const target of (this.hitTargets || []).slice().reverse()) {
      const points = target.points; let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [ax,ay] = points[i], [bx,by] = points[j];
        if ((ay > y) !== (by > y) && x < (bx-ax) * (y-ay) / (by-ay) + ax) inside = !inside;
      }
      if (inside) return target.cell;
    }
    return null;
  }
  drawVehicle(ctx,o,time) {
    const kind=o.vehicleKind,n=o.variant;
    const colors={bus:['#f4ce68','#ce9c3c','#a17832'],freight:['#c0d2b6','#859e77','#607956'],fire:['#fb9b82','#ce5144','#9d3939'],healthcare:['#fff7df','#e2e6d4','#aebfc1'],police:['#b7d3e4','#507f9d','#345973'],garbage:['#b8ce81','#73994c','#526f3a']};
    const palette=colors[kind]||[['#f5cb6e','#c28d48','#9e7035'],['#f4f3e7','#b7c6c4','#859e9c'],['#e8907d','#c06655','#944738'],['#89c9de','#559bb6','#37778f']][n%4];
    ctx.fillStyle='#203b4233';ctx.beginPath();ctx.ellipse(1,2,5,2,0,0,Math.PI*2);ctx.fill();
    const wide=['bus','freight','garbage'].includes(kind)?5:3.6;
    box(ctx,0,0,wide,wide/2,3,palette);
    box(ctx,0,-3,wide*.58,wide*.29,1.2,['#d3e9e6','#57777f','#416370']);
    ctx.fillStyle='#263c43';ctx.fillRect(-wide+1,0,2,2);ctx.fillRect(wide-2,0,2,2);
    if(['fire','healthcare','police'].includes(kind)){ctx.fillStyle=Math.sin(time*8+n)>0?'#ff8067':'#9bdbff';ctx.fillRect(-1,-5,2,2);}
  }
}
