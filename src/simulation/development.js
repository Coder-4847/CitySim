import { ZONES, officeEducation } from './rules.js';
import { accessRoads, graphFor } from '../transport/graph.js';

// Use the same thresholds as the development simulation to explain waiting parcels.
export function developmentNeeds(city, i, metrics) {
  const c=city.cells[i];
  if(!c?.zone || c.building!=null) return [];
  const needs=[], road=accessRoads(city,[i])[0];
  const n=road==null?null:metrics.networks[graphFor(city).components[road]];
  if(road==null) needs.push('A road directly beside this parcel');
  const rule=ZONES[c.zone], density=c.density||1;
  if(!n || n.power<n.powerDemand+rule.power*density) needs.push('Spare power on the connected road network');
  if(!n || n.water<n.waterDemand+rule.water*density) needs.push('Spare water on the connected road network');
  const district=city.districts.find(d=>d.id===c.district);
  if(city.demand[c.zone]+(district?.policies?.taxRelief?15:0)<16) needs.push('More demand for this zone');
  const field=c.zone==='residential'?'desirability':c.zone==='industrial'?'industrialDesire':'commercialDesire';
  if(metrics.fields[field][i]<30) needs.push('Better surroundings, away from pollution and noise');
  if(c.zone==='office' && metrics.education<officeEducation(c.density)) needs.push(`At least ${officeEducation(c.density)*100}% city education`);
  return needs;
}
