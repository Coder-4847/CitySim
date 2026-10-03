export const SIZE = 56;
export const SAVE_VERSION = 5;
export const ZONE_TIERS = [
  {name:'Low density',multiplier:1,cost:1,unlock:0,description:'Small homes and local businesses. Lowest infrastructure demand.'},
  {name:'Medium density',multiplier:2,cost:2,unlock:2,description:'Larger blocks with twice the capacity and utility demand.'},
  {name:'High density',multiplier:3,cost:5,unlock:3,description:'Major developments with three times the capacity. Invest in services and transport.'},
];
export const ZONES = {
  residential: { label: 'Residential', color: '#69af86', cost: 8, capacity: 18, power: 4, water: 5 },
  commercial: { label: 'Commercial', color: '#6aaac4', cost: 8, capacity: 10, power: 5, water: 4 },
  industrial: { label: 'Industrial', color: '#d5ae55', cost: 8, capacity: 16, power: 9, water: 6 },
  office: { label: 'Office', color: '#a594c7', cost: 14, capacity: 14, power: 7, water: 4 },
};
export const ZONING_TOOLS = Object.fromEntries(Object.entries(ZONES).flatMap(([zone,r])=>ZONE_TIERS.map((tier,n)=>[n===0?zone:n===1&&['residential','commercial'].includes(zone)?'dense'+zone[0].toUpperCase()+zone.slice(1):(n===1?'medium':'high')+zone[0].toUpperCase()+zone.slice(1),{zone,tier:n+1,name:`${r.label} · Tier ${n+1}`,cost:r.cost*tier.cost,unlock:tier.unlock}])));
export const officeEducation = density => [0,.25,.45][(density||1)-1];
export const FACILITIES = {
  busDepot: { label: 'Bus depot', cost: 4500, maintenance: 120, power: 0, water: 0, usePower: 8, useWater: 4, fleet: 12, unlock: 1, description: 'Supports 12 buses. Place stops on streets, then connect them with a bus route.' },
  wind: { label: 'Wind station', cost: 2400, maintenance: 95, power: 450, water: 0, color: '#dcebdc', description: '450 power units. Serves its connected road network.' },
  water: { label: 'Water tower', cost: 1800, maintenance: 65, power: 0, water: 450, color: '#76b7c4', description: '450 water units. Serves its connected road network.' },
  coal: { label:'Coal power station', cost:8000, maintenance:390, power:2400, water:0, pollution:65, unlock:1, description:'2,400 dependable power units. Cheap capacity, heavy local pollution. Keep well away from housing.' },
  gas: { label:'Gas turbine plant', cost:18000, maintenance:650, power:4800, water:0, pollution:24, unlock:2, description:'4,800 power units with lower emissions than coal, at a higher operating cost.' },
  solar: { label:'Solar energy center', cost:24000, maintenance:240, power:3200, water:0, unlock:3, description:'3,200 clean power units. Includes storage for steady overnight supply; expensive to build, cheap to run.' },
  pump: { label:'Pumping station', cost:5200, maintenance:165, power:0, water:1800, usePower:35, unlock:1, description:'1,800 water units. Requires a working power network; a blackout stops pumping.' },
  treatment: { label:'Water treatment works', cost:15000, maintenance:410, power:0, water:5400, usePower:100, unlock:2, description:'5,400 water units for a growing city. High power demand; stops during grid shortages.' },
  reservoir: { label:'Reservoir complex', cost:32000, maintenance:620, power:0, water:9000, unlock:3, description:'9,000 water units from a gravity-fed storage complex. Expensive but keeps supplying water during blackouts.' },
  cityPark: { label:'City park', cost:4200, maintenance:110, power:0, water:0,useWater:8,service:'park',capacity:0,radius:20,unlock:1,description:'A larger public green space with broader land-value and desirability benefits.' },
  precinct: { label:'Police headquarters', cost:10500, maintenance:320,power:0,water:0,usePower:20,useWater:12,service:'police',capacity:3000,radius:30,unlock:2,description:'A large precinct protecting 3,000 residents with wider street coverage.' },
  centralFire: { label:'Central fire headquarters',cost:11000,maintenance:350,power:0,water:0,usePower:18,useWater:24,service:'fire',capacity:3600,radius:32,unlock:2,description:'Regional fire protection for 3,600 residents. Road connectivity and congestion still affect response.' },
  recycling: { label:'Recycling center',cost:14000,maintenance:340,power:0,water:0,usePower:28,useWater:12,service:'garbage',capacity:3000,radius:30,pollution:10,unlock:2,description:'Processes waste for 3,000 resident equivalents with far less pollution than a waste depot.' },
  cityHall: { label:'Civic square & city hall',cost:7500,maintenance:160,power:0,water:0,usePower:10,useWater:6,service:'park',capacity:0,radius:14,unlock:1,description:'A civic landmark and public square. Improves nearby land value and neighborhood appeal.' },
  park: { label: 'Neighborhood park', cost: 700, maintenance: 18, power: 0, water: 0, service: 'park', capacity: 0, radius: 9, unlock: 0, description: 'A green retreat. Raises desirability and land value along nearby streets.' },
  garbage: { label: 'Waste depot', cost: 2200, maintenance: 85, power: 0, water: 0, usePower: 8, useWater: 3, service: 'garbage', capacity: 700, radius: 22, unlock: 0, description: 'Collects 700 resident-equivalent units of waste. Pollutes nearby land; place it away from housing.' },
  school: { label: 'Elementary school', cost: 2800, maintenance: 100, power: 0, water: 0, usePower: 6, useWater: 5, service: 'school', capacity: 150, radius: 14, unlock: 1, description: '150 student places. Education develops gradually and supports building upgrades.' },
  clinic: { label: 'Community clinic', cost: 2600, maintenance: 95, power: 0, water: 0, usePower: 8, useWater: 6, service: 'healthcare', capacity: 600, radius: 15, unlock: 1, description: 'Healthcare for 600 residents. Clean surroundings and waste collection also protect health.' },
  police: { label: 'Police station', cost: 2400, maintenance: 90, power: 0, water: 0, usePower: 6, useWater: 4, service: 'police', capacity: 700, radius: 18, unlock: 1, description: 'Protects up to 700 residents. Crime also responds to unemployment and education.' },
  fire: { label: 'Fire station', cost: 2500, maintenance: 90, power: 0, water: 0, usePower: 6, useWater: 6, service: 'fire', capacity: 900, radius: 20, unlock: 1, description: 'Fire protection and routed emergency response. Congestion delays arrival.' },
  secondary: { label: 'Secondary school', cost: 4800, maintenance: 180, power: 0, water: 0, usePower: 10, useWater: 8, service: 'secondary', capacity: 250, radius: 19, unlock: 2, description: '250 student places. Builds on elementary education for a skilled workforce.' },
  hospital: { label: 'Regional hospital', cost: 6500, maintenance: 230, power: 0, water: 0, usePower: 18, useWater: 14, service: 'healthcare', capacity: 1800, radius: 26, unlock: 2, description: 'Broad healthcare coverage for 1,800 residents. Requires more power and water.' },
  university: { label: 'City university', cost: 10000, maintenance: 320, power: 0, water: 0, usePower: 20, useWater: 12, service: 'university', capacity: 450, radius: 30, unlock: 3, description: '450 advanced study places. Enables the most skilled businesses and development.' },
};
export const SERVICE_TYPES = ['school', 'secondary', 'university', 'healthcare', 'police', 'fire', 'garbage', 'park'];
export const STAGES = ['Settlement', 'Village', 'Town', 'Regional center', 'Small city', 'Major city', 'Metropolis'];
export const STAGE_POPULATION = [0, 100, 500, 2000, 5000, 10000, 25000];
export function capacity(b) { return ({ residential: [18, 30, 48], commercial: [10, 18, 30], industrial: [16, 24, 36], office:[14,24,40] })[b.type][b.level - 1] * (b.density||1); }
export function utilityNeed(b, type) { return ZONES[b.type][type] * [1, 1.5, 2.2][b.level - 1] * (b.density||1); }
export function buildingDefaults(b) {
  for (const [key, value] of Object.entries({ education: .15, waste: 0, goodDays: 0, badDays: 0, status: 'stable', damage: 0 })) if (b[key] == null) b[key] = value;
  return b;
}
export const ROAD_COST = 45;
export const BRIDGE_COST = 180;
export const ROAD_MAINTENANCE = 0.8;
export const ROAD_CAPACITY = 45;
export const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export const index = (x, y, size = SIZE) => y * size + x;
export const coordinates = (i, size = SIZE) => [i % size, Math.floor(i / size)];
export function neighbors(i, size = SIZE) {
  const [x, y] = coordinates(i, size);
  const result = [];
  if (x > 0) result.push(i - 1);
  if (x < size - 1) result.push(i + 1);
  if (y > 0) result.push(i - size);
  if (y < size - 1) result.push(i + size);
  return result;
}
export function random(city) {
  city.rng = (city.rng + 0x6D2B79F5) >>> 0;
  let t = city.rng;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
export function hashSeed(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
