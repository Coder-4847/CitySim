export const POLICIES = {
  cleanIndustry: {label:'Clean industry',description:'Halves industrial emissions; firms lose 10% productivity.'},
  freeTransit: {label:'Free bus travel',description:'Residents ride without fares; more commuters prefer the bus.'},
  taxRelief: {label:'Local tax relief',description:'Reduces effective tax by 2 points, helping local development and migration.'},
};
export function districtAt(city,cell) { return city.districts?.find(d=>d.id===city.cells[cell].district); }
export function policy(city,cell,key) { return !!districtAt(city,cell)?.policies[key]; }
export function effectiveTax(city,b) { return Math.max(0,city.taxes[b.type]-(policy(city,b.cell,'taxRelief')?2:0)); }
export function createDistrict(city,name) {
  if(city.districts.length>=24) throw new Error('This map supports up to 24 districts.');
  const district={id:city.nextId++,name:String(name).trim().slice(0,40)||'New district',policies:{cleanIndustry:false,freeTransit:false,taxRelief:false}};
  city.districts.push(district);city.revision++;return district;
}
