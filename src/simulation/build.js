import { ROADS } from '../transport/roads.js';
import { FACILITIES, ZONES, ZONING_TOOLS, ROAD_COST, BRIDGE_COST, coordinates, index, STAGES } from './rules.js';

export function selection(city, start, end, tool) {
  if (![start,end].every(i=>Number.isInteger(i)&&i>=0&&i<city.cells.length)) return [];
  const [x1, y1] = coordinates(start, city.size), [x2, y2] = coordinates(end, city.size);
  const result = [];
  if (ROADS[tool]) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) result.push(index(x, y1, city.size));
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) result.push(index(x2, y, city.size));
  } else if (FACILITIES[tool]) {
    for (let y = y2; y < y2 + 2; y++) for (let x = x2; x < x2 + 2; x++) result.push(x < city.size && y < city.size ? index(x, y, city.size) : -1);
  } else {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) result.push(index(x, y, city.size));
  }
  return [...new Set(result)];
}
export function planBuild(city, tool, indices, options = {}) {
  if(!Object.hasOwn(ROADS,tool)&&!Object.hasOwn(ZONING_TOOLS,tool)&&!Object.hasOwn(FACILITIES,tool)&&!['denseResidential','denseCommercial','district','districtErase','stop','removeStop','signal','bulldoze','dezone'].includes(tool))return {valid:false,reason:'Choose a construction tool.',cost:0,indices:[]};
  if(!Array.isArray(indices)||indices.some(i=>!Number.isInteger(i)||i<0||i>=city.cells.length))return {valid:false,reason:'Choose parcels inside the map.',cost:0,indices:[]};
  const road=ROADS[tool],zoning=ZONING_TOOLS[tool];
  const zone=zoning?.zone||tool,tier=zoning?.tier||1;
  let cost = 0; const changes = [];
  if (!indices.length || indices.length > city.cells.length) return { valid: false, reason: 'Choose a parcel inside the map.', cost: 0, indices: [] };
  indices = [...new Set(indices)];
  if (((zoning && city.milestone<zoning.unlock) || (tool==='highway' && city.milestone<2))) return {valid:false,reason:`Unlocked at ${STAGES[zoning?.unlock||2]}.`,cost:0,indices};
  if (tool==='district' && !city.districts.some(d=>d.id===options.districtId)) return {valid:false,reason:'Create or select a district first.',cost:0,indices};
  if (FACILITIES[tool]) {
    if ((FACILITIES[tool].unlock || 0) > city.milestone) return { valid: false, reason: `Unlocked at ${STAGES[FACILITIES[tool].unlock]}.`, cost: FACILITIES[tool].cost, indices };
    const sorted = [...indices].sort((a, b) => a - b), a = sorted[0];
    if (indices.length !== 4 || a < 0 || a % city.size >= city.size - 1 || sorted.join() !== [a, a + 1, a + city.size, a + city.size + 1].join())
      return { valid: false, reason: 'Facilities require a clear 2 × 2 footprint inside the map.', cost: FACILITIES[tool].cost, indices };
  }
  if (tool === 'bulldoze') {
    const expanded = new Set(indices);
    for (const i of indices) {
      const id = city.cells[i]?.facility;
      const facility = id != null ? city.facilities.find(f => f.id === id) : null;
      if (facility) for (const j of facility.cells) expanded.add(j);
    }
    indices = [...expanded];
  }
  for (const i of indices) {
    const c = city.cells[i];
    if (!c) return { valid: false, reason: 'Stay inside the map boundary.', cost, indices };
    if (tool === 'district' || tool==='districtErase') {if(c.district!==(tool==='district'?options.districtId:null)) changes.push(i);continue;}
    if (['stop','removeStop','signal'].includes(tool)) {
      if(!c.road || c.roadType==='highway') return {valid:false,reason:'Choose a local street, avenue, or one-way street.',cost:0,indices};
      if(tool==='signal' || tool==='stop'&&!c.stop || tool==='removeStop'&&c.stop) {changes.push(i);cost+=tool==='signal'?120:tool==='stop'?75:0;}continue;
    }
    if (tool === 'bulldoze') {
      if (c.road || c.zone || c.building != null || c.facility != null || c.tree) { changes.push(i); cost += 10; }
      continue;
    }
    if (tool === 'dezone') { if (c.zone && c.building == null) changes.push(i); continue; }
    // Zoning is a paint brush: preserve streets, terrain, and existing buildings.
    if (ZONES[zone] && (c.terrain !== 'land' || c.road || (c.building != null && !(c.zone===zone && tier>(c.density||1))) || c.facility != null)) continue;
    if (c.terrain === 'rock' || (c.terrain === 'water' && !road)) return { valid: false, reason: 'This terrain cannot support that construction.', cost, indices };
    if ((!zoning && c.building != null) || c.facility != null || (!road && c.road)) return { valid: false, reason: 'Occupied land. Clear it with the bulldozer first.', cost, indices };
    if (road && (!c.road || (c.roadType||'road')!==tool)) {
      if(tool==='highway'&&c.stop)return {valid:false,reason:'Remove the bus stop before converting this street to highway.',cost:0,indices};
      changes.push(i);cost+=c.road?Math.max(20,(road.cost-ROADS[c.roadType||'road'].cost)*(c.terrain==='water'?4:1)):road.cost*(c.terrain==='water'?4:1);
    }
    else if (ZONES[zone] && (c.zone!==zone || (c.density||1)!==tier)) { changes.push(i);cost+=zoning.cost; }
    else if (FACILITIES[tool]) changes.push(i);
  }
  if (FACILITIES[tool]) cost = FACILITIES[tool].cost;
  return { valid: cost <= city.treasury && changes.length > 0, reason: cost > city.treasury ? 'Insufficient treasury.' : !changes.length ? (ZONES[zone] ? 'Drag over empty dry land beside a road. Existing buildings and roads are preserved.' : 'Nothing to change here.') : '', cost, indices, changes, skipped: indices.length-changes.length };
}
export function build(city, tool, indices, options = {}) {
  const plan = planBuild(city, tool, indices, options);
  if (!plan.valid) return plan;
  city.treasury -= plan.cost;
  if (FACILITIES[tool]) {
    const id = city.nextId++;
    const prefix = ['Willow', 'Cedar', 'Alder', 'Juniper', 'Brook', 'Harbor', 'Maple', 'Orchard'][id % 8];
    city.facilities.push({ id, type: tool, cells: [...plan.indices], name: `${prefix} ${FACILITIES[tool].label}` });
    for (const i of plan.indices) Object.assign(city.cells[i], { tree: false, zone: null, facility: id });
    city.timeline.push({ day: city.day, text: `${FACILITIES[tool].label} commissioned.` });
  } else for (const i of plan.changes) {
    const cell = city.cells[i];
    if (ROADS[tool]) Object.assign(cell, { road: true, roadType:tool, tree: false, zone: null, density:1 });
    else if (tool==='district'||tool==='districtErase') cell.district=tool==='district'?options.districtId:null;
    else if (tool==='stop'||tool==='removeStop') cell.stop=tool==='stop';
    else if (tool==='signal') cell.signal=!cell.signal;
    else if (ZONING_TOOLS[tool]) {cell.zone=ZONING_TOOLS[tool].zone;cell.density=ZONING_TOOLS[tool].tier;cell.tree=false;}
    else if (tool === 'dezone') cell.zone = null;
    else if (tool === 'bulldoze') {
      if (cell.building != null) {
        city.incidents = city.incidents.filter(incident => incident.buildingId !== cell.building);
        city.buildings = city.buildings.filter(b => b.id !== cell.building);
      }
      if (cell.facility != null) {
        const facilityId = cell.facility;
        const facility = city.facilities.find(f => f.id === facilityId);
        if (facility) for (const j of facility.cells) city.cells[j].facility = null;
        for (const incident of city.incidents) if (incident.responderId === facilityId) { incident.responderId = null; incident.arrival = 0; }
        city.facilities = city.facilities.filter(f => f.id !== facilityId);
      }
      Object.assign(cell, { road: false, roadType: null, stop:false, signal:false, zone: null, building: null, tree: false, density:1 });
    }
  }
  if(city.timeline.length>100)city.timeline.splice(0,city.timeline.length-100);
  city.graphRevision++;
  return plan;
}
