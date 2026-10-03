import { atmosphere, HONORS, districtIdentity } from '../simulation/life.js';
import { $, showDialog, escapeHTML, inspector, toast, money } from './panels.js';
import { TOOLS } from './icons.js';
import { TRANSPORT_TOOLS } from './mobility.js';
import { FACILITIES, ZONING_TOOLS } from '../simulation/rules.js';
import { selection, planBuild, build } from '../simulation/build.js';

export function journal(app,page='news'){
  const c=app.city,a=atmosphere(c,app.settings.lighting),life=c.life;
  const tabs={news:'City news',neighborhoods:'Neighborhoods',history:'History',honors:'Distinctions'};
  let body='';
  if(page==='news')body=`<p class="journal-intro">${a.season} · ${a.weather} · ${Math.floor(a.hour).toString().padStart(2,'0')}:00 presentation time. Weather and lighting are visual; the calendar and utility supply run independently.</p>${c.day<life.festivalUntil?`<div class="civic-intro"><strong>Neighborhood open days</strong><p>Housing demand target +10 until day ${life.festivalUntil}. Treasury contribution: $150.</p></div>`:''}${life.news.length?life.news.slice().reverse().map(n=>`<article class="news-item"><small>DAY ${n.day}</small><p>${escapeHTML(n.text)}</p>${n.cell!=null?`<button data-news-cell="${n.cell}">Show location</button>`:''}</article>`).join(''):'<p class="dialog-note">Your first bulletin arrives with the next monthly report. Stories reflect infrastructure, travel, trade, the budget, and your city’s progress.</p>'}`;
  if(page==='neighborhoods')body=c.districts.length?c.districts.map(d=>{const identity=districtIdentity(c,d,app.metrics);return `<article class="news-item"><h3>${escapeHTML(d.name)}</h3><p>${identity.identity}</p><small>${identity.population} residents · ${identity.buildings} buildings · ${identity.landValue} land value</small></article>`;}).join(''):'<p class="dialog-note">Create and paint districts in Transport → Districts. Their identity follows the buildings, residents, and education that develop there.</p>';
  if(page==='history')body=c.timeline.slice().reverse().map(n=>`<div class="timeline-row"><b>Day ${n.day}</b><span>${escapeHTML(n.text)}</span></div>`).join('');
  if(page==='honors')body=Object.entries(HONORS).map(([key,name])=>`<article class="news-item"><small>${life.honors.includes(key)?'EARNED':'WORKING TOWARD'}</small><h3>${name}</h3><p>${{village:'Reach 100 residents.',transit:'Carry at least one bus commuter.',trade:'Export goods to an external market.',healthy:'Reach 80% average health with at least 100 residents.'}[key]}</p></article>`).join('')+'<p class="dialog-note">Assessed with each monthly report. Distinctions stay earned and do not grant money.</p>';
  showDialog('The city lives',escapeHTML(c.name),`<nav class="stats-tabs">${Object.entries(tabs).map(([id,label])=>`<button data-journal-page="${id}" class="${page===id?'active':''}">${label}</button>`).join('')}</nav>${body}`,true);
  document.querySelectorAll('[data-journal-page]').forEach(b=>b.onclick=()=>journal(app,b.dataset.journalPage));
  document.querySelectorAll('[data-news-cell]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.newsCell);app.view.inspected=i;app.camera.focus(i%c.size,Math.floor(i/c.size));$('dialog').close();inspector(app);});
}

export function mapActions(app){
  const c=app.city,i=app.view.inspected??24+c.size*25,x=i%c.size,y=Math.floor(i/c.size);
  const tools={...Object.fromEntries(Object.entries(ZONING_TOOLS).map(([id,r])=>[id,r.name])),...Object.fromEntries(TOOLS.map(t=>[t.id,t.name])),...Object.fromEntries(Object.entries(TRANSPORT_TOOLS).map(([k,t])=>[k,t.name])),...Object.fromEntries(Object.entries(FACILITIES).map(([k,t])=>[k,t.label]))};
  const field=(name,value)=>`<label class="field"><span>${name}</span><input name="${name}" aria-label="${name}" type="number" min="0" max="${c.size-1}" value="${value}" required></label>`;
  showDialog('Map actions','Inspect, construct, or paint by parcel coordinates. Keyboard shortcut: P.',`<form id="parcel-form"><label class="field"><span>ACTION</span><select name="tool" aria-label="Map action">${Object.entries(tools).map(([id,name])=>`<option value="${id}" ${id===app.tool?'selected':''}>${name}</option>`).join('')}</select></label><div class="form-grid">${field('Start X',x)}${field('Start Y',y)}${field('End X',x)}${field('End Y',y)}</div><label class="field"><span>DISTRICT FOR PAINTING</span><select name="district" aria-label="Paint district"><option value="">Select district</option>${c.districts.map(d=>`<option value="${d.id}" ${d.id===app.activeDistrict?'selected':''}>${escapeHTML(d.name)}</option>`).join('')}</select></label><p id="parcel-preview" class="dialog-note" aria-live="polite"></p><div class="dialog-actions"><button class="primary">Apply action</button></div><p class="dialog-note">Inspect and route-stop selection use the end parcel. Facilities occupy a 2 × 2 area starting at the end parcel. Roads follow an L; other areas use a rectangle. All normal costs and unlocks apply.</p></form>`);
  const form=$('parcel-form');
  const read=()=>{const d=new FormData(form);return {tool:d.get('tool'),start:Number(d.get('Start Y'))*c.size+Number(d.get('Start X')),end:Number(d.get('End Y'))*c.size+Number(d.get('End X')),districtId:d.get('district')?Number(d.get('district')):null};};
  form.oninput=()=>{if(!form.checkValidity())return;const q=read(),plan=planBuild(c,q.tool,selection(c,q.start,q.end,q.tool),q);$('parcel-preview').textContent=q.tool==='inspect'?'Inspect this parcel and center the camera.':q.tool==='routeStop'?'Add this existing bus stop to your current route draft.':plan.valid?`${plan.changes.length} parcels · ${money(plan.cost)}`:plan.reason;};
  form.onsubmit=e=>{
    e.preventDefault();if(!form.checkValidity())return;const q=read();
    if(q.tool==='routeStop'){if(!c.cells[q.end].stop||app.routeDraft.includes(q.end)||app.routeDraft.length>=24){toast('Choose an unused bus stop; routes allow 24 stops.',true);return;}app.routeDraft.push(q.end);toast('Stop added. Open Transport to finish the route.');}
    else if(q.tool!=='inspect'){const result=build(c,q.tool,selection(c,q.start,q.end,q.tool),q);if(!result.valid){toast(result.reason,true);return;}app.activeDistrict=q.districtId;app.refresh();toast(`Action applied: ${money(result.cost)}.`);}
    app.view.inspected=q.end;app.camera.focus(q.end%c.size,Math.floor(q.end/c.size));app.selectTool('inspect');$('dialog').close();inspector(app);
  };
  form.oninput();
}
