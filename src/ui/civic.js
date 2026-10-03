import { FACILITIES, STAGES, STAGE_POPULATION, ZONES, ZONE_TIERS, ZONING_TOOLS, SERVICE_TYPES, officeEducation, capacity } from '../simulation/rules.js';
import { $, showDialog, money, escapeHTML } from './panels.js';
import { icon } from './icons.js';

const groups={parks:'Parks & civic',education:'Education',health:'Healthcare',safety:'Police & fire',waste:'Waste',power:'Power',water:'Water',funding:'Funding'};
const group=r=>r.power?'power':r.water?'water':r.service==='park'?'parks':['school','secondary','university'].includes(r.service)?'education':r.service==='healthcare'?'health':['police','fire'].includes(r.service)?'safety':'waste';
const serviceNames={park:'Parks & public spaces',school:'Elementary education',secondary:'Secondary education',university:'Higher education',healthcare:'Healthcare',police:'Police',fire:'Fire & rescue',garbage:'Waste collection'};
export function serviceCatalog(app,page='parks') {
  const c=app.city,m=app.metrics;
  const rules=Object.entries(FACILITIES).filter(([,r])=>(r.service||r.power||r.water)&&group(r)===page).sort((a,b)=>a[1].cost-b[1].cost);
  let body=`<div class="civic-intro"><span class="eyebrow">${STAGES[c.milestone]}</span><p>Choose a facility, then place its 2 × 2 footprint beside a connected road. ${STAGE_POPULATION[c.milestone+1]?`Next unlock: ${STAGES[c.milestone+1]} at ${STAGE_POPULATION[c.milestone+1].toLocaleString()} residents.`:'All population milestones reached.'}</p></div>`;
  if(page==='power'||page==='water')body+=`<div class="utility-balance"><strong>${Math.round(m[page]).toLocaleString()} supplied</strong><span>${Math.round(m[page+'Demand']).toLocaleString()} demanded · ${Math.round(m[page]-m[page+'Demand']).toLocaleString()} spare</span></div>`;
  if(page==='funding'){
    body=`<p class="journal-intro">Set each department from 50% to 150%. Funding scales upkeep and service capacity; coverage strength also responds. Larger budgets cannot fix disconnected roads or missing utilities.</p>${SERVICE_TYPES.map(k=>{
      const facilities=c.facilities.filter(f=>FACILITIES[f.type].service===k),rate=c.funding[k],cost=facilities.reduce((sum,f)=>sum+FACILITIES[f.type].maintenance*rate,0);
      return `<div class="department-row"><div><strong>${serviceNames[k]}</strong><small>${facilities.length} ${facilities.length===1?'facility':'facilities'} · ${money(cost)} / month</small></div><label><span class="sr-only">${serviceNames[k]} funding</span><select data-funding="${k}">${[.5,.75,1,1.25,1.5].map(v=>`<option value="${v}" ${rate===v?'selected':''}>${v*100}%</option>`).join('')}</select></label></div>`;
    }).join('')}<p class="dialog-note">Current public service upkeep: ${money(m.serviceExpenses)} / month. Changes apply immediately; cash settles on the monthly boundary.</p>`;
  }else body+=`<div class="service-grid">${rules.map(([id,r])=>{
    const locked=c.milestone<(r.unlock||0),owned=c.facilities.filter(f=>f.type===id),operating=owned.filter(f=>m.facilities.get(f.id)?.active).length;
    return `<button class="service-card${locked?' locked':''}" data-service="${id}" ${locked?'disabled':''}>${icon(id)}<span><strong>${r.label}</strong><small>${escapeHTML(r.description)}</small><b>${money(r.cost)} · ${money(r.maintenance*(c.funding[r.service]??1))} / month</b><em>${r.power?`${r.power.toLocaleString()} power`:r.water?`${r.water.toLocaleString()} water`:`${r.capacity||'Open'} capacity · ${r.radius} street steps`}</em><em>${r.usePower||0} power / ${r.useWater||0} water needed · ${r.pollution||id==='garbage'?`${r.pollution||42} emissions`:'No facility emissions'}</em><em>${locked?`Unlock: ${STAGES[r.unlock]} · ${STAGE_POPULATION[r.unlock].toLocaleString()} residents`:`${owned.length} built · ${operating} operational`}</em></span></button>`;
  }).join('')}</div>`;
  showDialog('Government & infrastructure','Build the services that let a settlement become a city.',`<nav class="stats-tabs">${Object.entries(groups).map(([id,name])=>`<button data-civic-page="${id}" class="${page===id?'active':''}">${name}</button>`).join('')}</nav>${body}`,true);
  document.querySelectorAll('[data-civic-page]').forEach(b=>b.onclick=()=>serviceCatalog(app,b.dataset.civicPage));
  document.querySelectorAll('[data-service]').forEach(b=>b.onclick=()=>{app.selectTool(b.dataset.service);$('dialog').close();});
  document.querySelectorAll('[data-funding]').forEach(input=>input.onchange=()=>{const rate=Number(input.value);if(![.5,.75,1,1.25,1.5].includes(rate))return;c.funding[input.dataset.funding]=rate;c.revision++;app.refresh();serviceCatalog(app,'funding');});
}
export function zoningCatalog(app,zone='residential'){
  const c=app.city;
  showDialog('Shape your neighborhoods','Choose density now. Buildings earn development levels through good city conditions.',`<nav class="stats-tabs">${Object.entries(ZONES).map(([id,r])=>`<button data-zone-page="${id}" class="${zone===id?'active':''}">${r.label}</button>`).join('')}</nav><div class="zone-tier-grid">${Object.entries(ZONING_TOOLS).filter(([,r])=>r.zone===zone).map(([id,r])=>{
    const tier=ZONE_TIERS[r.tier-1],locked=c.milestone<r.unlock;
    return `<button class="service-card zone-tier" data-zone-choice="${id}" ${locked?'disabled':''}><span><span class="tier-skyline tier-${r.tier}" aria-hidden="true"><i></i><i></i><i></i></span><strong>Tier ${r.tier} · ${tier.name}</strong><small>${tier.description}${zone==='office'?` ${r.tier===1?'Local offices need demand and utilities; no education gate.':`Requires ${officeEducation(r.tier)*100}% city education (currently ${Math.round(app.metrics.education*100)}%).`}`:''}</small><b>${money(r.cost)} / parcel</b><em>${[1,2,3].map(level=>`Level ${level}: ${capacity({type:zone,level,density:r.tier})} ${zone==='residential'?'residents':'jobs'}`).join('<br>')}</em><em>${locked?`Unlock: ${STAGES[r.unlock]} · ${STAGE_POPULATION[r.unlock].toLocaleString()} residents`:'Available to zone'}</em></span></button>`;
  }).join('')}</div><p class="dialog-note">Higher density costs more and supports more people and tax revenue, but needs more power, water, jobs, and services. Rezone occupied parcels of the same type upward to permit redevelopment after 60 prosperous days and enough utility capacity. Development levels 1–3 still require education, health, desirability, waste collection, and population milestones.</p>`,true);
  document.querySelectorAll('[data-zone-page]').forEach(b=>b.onclick=()=>zoningCatalog(app,b.dataset.zonePage));
  document.querySelectorAll('[data-zone-choice]').forEach(b=>b.onclick=()=>{app.selectTool(b.dataset.zoneChoice);$('dialog').close();});
}
