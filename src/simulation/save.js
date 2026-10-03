import { newLife, HONORS } from './life.js';
import { ROADS } from '../transport/roads.js';
import { POLICIES } from './districts.js';
import { SAVE_VERSION, SERVICE_TYPES, SIZE, ZONES, FACILITIES, hashSeed, capacity, buildingDefaults } from './rules.js';

const finite = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const integer = (v, min, max) => Number.isInteger(v) && finite(v, min, max);
function validate(city, sourceVersion = SAVE_VERSION) {
  const legacy=sourceVersion===1,old=sourceVersion<3;
  const fail = () => { throw new Error('The save contains invalid city data.'); };
  if (!city || city.version !== sourceVersion || city.size !== SIZE || typeof city.name !== 'string' || city.name.length > 32 ||
    typeof city.seed !== 'string' || city.seed.length > 64 || !['river', 'coast', 'plains'].includes(city.terrain) ||
    !['relaxed', 'standard', 'challenging'].includes(city.difficulty) || !integer(city.day, 0, 1e9) ||
    !finite(city.treasury, -1e12, 1e12) || !integer(city.rng, 0, 4294967295) || !integer(city.graphRevision, 0, 1e9) ||
    !integer(city.nextId, 1, 1e9) || !integer(city.milestone, 0, legacy ? 3 : 6) || typeof city.tutorialDismissed !== 'boolean' ||
    !Array.isArray(city.cells) || city.cells.length !== SIZE * SIZE ||
    !Array.isArray(city.buildings) || city.buildings.length > SIZE * SIZE ||
    !Array.isArray(city.facilities) || city.facilities.length > SIZE * SIZE / 4) fail();
  for (const type of Object.keys(ZONES).filter(t=>!old||t!=='office')) if (!finite(city.taxes?.[type], 0, 20) || !finite(city.demand?.[type], -100, 100)) fail();
  for (const key of ['income', 'expenses', 'net']) if (!finite(city.ledger?.[key], -1e12, 1e12)) fail();
  const ids = new Set(), occupied = new Set(), buildingById=new Map(), facilityById=new Map();
  for (const b of city.buildings) {
    if (!b || !integer(b.id, 1, city.nextId - 1) || ids.has(b.id) || !integer(b.cell, 0, SIZE * SIZE - 1) || occupied.has(b.cell) ||
      !Object.hasOwn(ZONES, b.type) || (old&&b.type==='office') || (b.density!=null&&!integer(b.density,1,old?1:sourceVersion<5?2:3)) || !integer(b.level, 1, legacy ? 1 : 3) || !integer(b.variant, 0, 7) || !finite(b.progress, 0, 1) ||
      !integer(b.duration, 8, 16) || !finite(b.occupants, 0, capacity(b)) ||
      (b.type !== 'residential' && b.occupants !== 0) || typeof b.name !== 'string' || b.name.length > 80 ||
      city.cells[b.cell]?.building !== b.id || city.cells[b.cell]?.zone !== b.type) fail();
    if (!legacy && (!['stable','prosperous','struggling','abandoned'].includes(b.status) || !finite(b.education, 0, 1) || !finite(b.waste, 0, 1) || !finite(b.damage, 0, 1) || !integer(b.goodDays, 0, 1e9) || !integer(b.badDays, 0, 1e9))) fail();
    ids.add(b.id); occupied.add(b.cell);buildingById.set(b.id,b);
  }
  for (const f of city.facilities) {
    if (!f || !integer(f.id, 1, city.nextId - 1) || ids.has(f.id) || !Object.hasOwn(FACILITIES, f.type) || (old&&f.type==='busDepot') || (legacy && !['wind','water'].includes(f.type)) || typeof f.name !== 'string' || f.name.length > 80 ||
      !Array.isArray(f.cells) || f.cells.length !== 4 || new Set(f.cells).size !== 4) fail();
    const sorted = [...f.cells].sort((a, b) => a - b), a = sorted[0];
    if (a % SIZE >= SIZE - 1 || sorted.join() !== [a, a + 1, a + SIZE, a + SIZE + 1].join()) fail();
    for (const i of f.cells) {
      if (!integer(i, 0, SIZE * SIZE - 1) || occupied.has(i) || city.cells[i]?.facility !== f.id) fail();
      occupied.add(i);
    }
    ids.add(f.id);facilityById.set(f.id,f);
  }
  for (let i = 0; i < city.cells.length; i++) {
    const c = city.cells[i];
    if (!c || !['water', 'land', 'rock'].includes(c.terrain) || !integer(c.elevation, 0, 4) || !integer(c.variant, 0, 6) ||
      typeof c.tree !== 'boolean' || typeof c.road !== 'boolean' || (c.zone != null && !Object.hasOwn(ZONES, c.zone)) ||
      (c.building != null && buildingById.get(c.building)?.cell!==i) ||
      (c.facility != null && !facilityById.get(c.facility)?.cells.includes(i)) ||
      (c.road && (c.zone != null || c.building != null || c.facility != null || c.terrain === 'rock')) ||
      ((c.building != null || c.facility != null || c.zone != null) && c.terrain !== 'land')) fail();
  }
  if (!Array.isArray(city.history) || city.history.length > 240 || !Array.isArray(city.timeline) || city.timeline.length > 100) fail();
  for (const entry of city.timeline) if (!entry || !integer(entry.day, 0, city.day) || typeof entry.text !== 'string' || entry.text.length > 200) fail();
  for (const h of city.history) {
    if (!h || !integer(h.day, 0, city.day)) fail();
    for (const k of ['population', 'jobs', 'unemployment', 'treasury', 'income', 'expenses', 'power', 'water', 'traffic']) if (!finite(h[k], -1e12, 1e12)) fail();
    for (const type of Object.keys(ZONES).filter(t=>!old||t!=='office')) if (!finite(h.demand?.[type], -100, 100)) fail();
    for (const k of ['health','education','landValue','crime','commuteDelay','garbage','pollution','abandoned','ridership','transitDemand','fareRevenue','imports','exports']) if (h[k] != null && !finite(h[k], 0, 1e9)) fail();
  }
  if (!legacy) {
    if (!integer(city.revision, 0, 1e9) || !Array.isArray(city.ground) || city.ground.length !== SIZE * SIZE || city.ground.some(v => !finite(v, 0, 100)) || !Array.isArray(city.incidents) || city.incidents.length > city.buildings.length) fail();
    const burning = new Set();
    for (const incident of city.incidents) {
      if (!incident || !integer(incident.id, 1, city.nextId - 1) || ids.has(incident.id) || burning.has(incident.buildingId) || !city.buildings.some(b => b.id === incident.buildingId) ||
        !integer(incident.age, 0, 1e9) || !finite(incident.severity, 0, 1) || !integer(incident.arrival, 0, 1e9) ||
        (incident.responderId != null && !city.facilities.some(f => f.id === incident.responderId && FACILITIES[f.type].service === 'fire'))) fail();
      ids.add(incident.id); burning.add(incident.buildingId);
    }
  }
  if(!old){
    if(!Array.isArray(city.districts)||city.districts.length>24||!Array.isArray(city.busRoutes)||city.busRoutes.length>24)fail();
    for(const d of city.districts){
      if(!d||!integer(d.id,1,city.nextId-1)||ids.has(d.id)||typeof d.name!=='string'||d.name.length>40||!d.policies||Object.keys(POLICIES).some(k=>typeof d.policies[k]!=='boolean'))fail();ids.add(d.id);
    }
    for(const r of city.busRoutes){
      if(!r||!integer(r.id,1,city.nextId-1)||ids.has(r.id)||typeof r.name!=='string'||r.name.length>40||typeof r.enabled!=='boolean'||!integer(r.buses,1,12)||!finite(r.fare,0,5)||!Array.isArray(r.stops)||r.stops.length<2||r.stops.length>24||new Set(r.stops).size!==r.stops.length||r.stops.some(i=>!integer(i,0,SIZE*SIZE-1)))fail();ids.add(r.id);
    }
    for(const c of city.cells){
      if(c.roadType!=null&&(!c.road||!Object.hasOwn(ROADS,c.roadType)))fail();
      if(c.density!=null&&!integer(c.density,1,sourceVersion<5?2:3))fail();
      if(c.district!=null&&!city.districts.some(d=>d.id===c.district))fail();
      for(const k of ['stop','signal'])if(c[k]!=null&&typeof c[k]!=='boolean')fail();
      if((c.stop||c.signal)&&!c.road || c.stop&&c.roadType==='highway')fail();
    }
  }
  if(sourceVersion>=4){
    const l=city.life;
    if(!l||!Array.isArray(l.news)||l.news.length>60||!Array.isArray(l.honors)||l.honors.length>Object.keys(HONORS).length||new Set(l.honors).size!==l.honors.length||l.honors.some(k=>!Object.hasOwn(HONORS,k))||!integer(l.lastReport,0,city.day)||!integer(l.festivalUntil,0,city.day+14))fail();
    for(const n of l.news)if(!n||!integer(n.day,0,city.day)||typeof n.key!=='string'||n.key.length>40||typeof n.text!=='string'||n.text.length>300||(n.cell!=null&&!integer(n.cell,0,SIZE*SIZE-1)))fail();
  }
  if(sourceVersion>=5 && SERVICE_TYPES.some(k=>!finite(city.funding?.[k],.5,1.5)))fail();
  return city;
}
export function serialize(city, now = new Date().toISOString()) {
  validate(city);
  const payload = JSON.stringify(city);
  return JSON.stringify({ format: 'CitySim', version: SAVE_VERSION, savedAt: now,
    checksum: hashSeed(payload).toString(16), payload });
}
export function deserialize(text) {
  try {
    if (typeof text !== 'string' || text.length > 8_000_000) throw new Error('The save file is too large.');
    const data = JSON.parse(text);
    if (!data || data.format !== 'CitySim') throw new Error('This is not a CitySim save.');
    if (![1,2,3,4,SAVE_VERSION].includes(data.version)) throw new Error('This save version is not supported.');
    if (typeof data.payload !== 'string' || data.checksum !== hashSeed(data.payload).toString(16)) throw new Error('The save checksum failed. The file may be damaged.');
    if (typeof data.savedAt !== 'string' || !Number.isFinite(Date.parse(data.savedAt))) throw new Error('Invalid save date.');
    const city = validate(JSON.parse(data.payload), data.version);
    if (data.version === 1) {
      city.version = SAVE_VERSION; city.revision = 0; city.ground = Array(SIZE * SIZE).fill(0); city.incidents = [];
      city.buildings.forEach(buildingDefaults);
    }
    if(data.version<3){
      city.version=SAVE_VERSION;city.districts=[];city.busRoutes=[];
      city.taxes.office=9;city.demand.office=0;
      for(const h of city.history)h.demand.office=0;
      for(const c of city.cells){c.roadType=c.road?'road':null;c.density=1;c.district=null;c.stop=false;c.signal=false;}
      for(const b of city.buildings)b.density=1;
    }
    if(data.version<4){city.version=SAVE_VERSION;city.life=newLife();}
    if(data.version<5){city.version=SAVE_VERSION;city.funding=Object.fromEntries(SERVICE_TYPES.map(k=>[k,1]));}
    validate(city);
    return { city, savedAt: data.savedAt };
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('The save is not valid JSON.');
    throw error;
  }
}
