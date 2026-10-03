import { developmentNeeds } from '../simulation/development.js';
import { atmosphere } from '../simulation/life.js';
import { roadRule } from '../transport/roads.js';
import { districtAt, effectiveTax } from '../simulation/districts.js';
import { deserialize, serialize } from '../simulation/save.js';
import { FACILITIES, ZONES, STAGES, STAGE_POPULATION, capacity, utilityNeed } from '../simulation/rules.js';
import { conditions } from '../simulation/city.js';
import { upgradeRequirements } from '../simulation/evolution.js';

export const $ = id => document.getElementById(id);
export const money = n => `${n < 0 ? '−' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
export const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const date = day => `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Math.floor(day / 30) % 12]} ${String(day % 30 + 1).padStart(2,'0')} · Year ${Math.floor(day / 360) + 1}`;
export function toast(text, error = false) {
  const el = document.createElement('div'); el.className = `toast${error ? ' error' : ''}`; el.textContent = text;
  while($('toasts').children.length>=2)$('toasts').firstElementChild.remove();
  $('toasts').append(el); setTimeout(() => el.remove(), 4500);
}
export function showDialog(title, subtitle, body, wide = false) {
  const dialog = $('dialog'); dialog.classList.toggle('wide', wide);
  dialog.setAttribute('aria-label',title.replace(/<[^>]*>/g,''));
  $('dialog-content').innerHTML = `<header class="dialog-header"><div><span class="eyebrow">CITYSIM · THE CITY LIVES</span><h2>${title}</h2><p>${subtitle}</p></div><button class="close-button" aria-label="Close dialog">×</button></header>${body}`;
  $('dialog-content').querySelector('.close-button').onclick = () => dialog.close();
  if (!dialog.open) dialog.showModal();
}
const fact = (name, value, cls = '') => `<div class="fact"><span>${name}</span><strong class="${cls}">${value}</strong></div>`;

export function updateHUD(app) {
  const { city, metrics: m } = app;
  $('city-name').textContent = city.name;
  if($('journal-button'))$('journal-button').textContent=`City journal${city.life.news.length?' · '+city.life.news.length:''}`;
  $('city-stage').textContent = STAGES[city.milestone];
  $('treasury').textContent = money(city.treasury);
  $('cashflow').textContent = `${m.net >= 0 ? '+' : '−'}$${Math.abs(m.net).toLocaleString('en-US')} / month`;
  $('cashflow').className = m.net >= 0 ? 'positive' : 'negative';
  $('population').textContent = m.population.toLocaleString('en-US');
  $('employment').textContent = `${m.jobs.toLocaleString('en-US')} jobs · ${Math.round(m.unemployment * 100)}% unemployed`;
  const sky=atmosphere(city,app.settings.lighting);$('date').textContent = date(city.day);$('date').title=`${sky.season} · ${sky.weather} · ${Math.floor(sky.hour)}:00 presentation time`;if($('weather-label'))$('weather-label').textContent=`${sky.season} · ${sky.weather}`;
  $('demand-bars').innerHTML = Object.entries(ZONES).map(([type, rule]) => `<div class="demand-column" title="${rule.label}: ${Math.round(city.demand[type])}%"><div class="demand-track"><div class="demand-fill" style="height:${Math.max(4, city.demand[type])}%;background:${rule.color}"></div></div><b>${type[0].toUpperCase()}</b></div>`).join('');
  $('status').textContent = `${city.buildings.length} buildings · ${m.roads} road tiles · ${m.shortage ? `${m.shortage} need infrastructure` : city.buildings.length ? 'All buildings served' : 'No development yet'}`;
  updateGuide(app);
  updateAlerts(app);
  if (app.view.inspected != null) inspector(app);
}
export function inspector(app) {
  const { city, metrics: m } = app, i = app.view.inspected, c = city.cells[i];
  if (!c) { $('inspector').hidden = true; return; }
  const b = city.buildings.find(b => b.id === c.building), f = city.facilities.find(f => f.id === c.facility);
  let title = 'Undeveloped land', tag = 'PARCEL INSPECTOR', facts = '', note = '', problems = [], rename;
  if (b) {
    const d = m.details.get(b.id); title = escapeHTML(b.name); tag = `${ZONES[b.type].label.toUpperCase()} · LEVEL ${b.level}`;
    facts = fact('State', b.progress < 1 ? `Construction ${Math.round(b.progress * 100)}%` : b.status) +
      fact(b.type === 'residential' ? 'Residents' : 'Workers / jobs', b.type === 'residential' ? `${Math.round(b.occupants)} / ${capacity(b)}` : `${Math.round(d.employed)} / ${capacity(b)}`) +
      fact('Road access', d.connected ? 'Connected' : 'Disconnected') + fact('Electricity', `${Math.round(d.power * 100)}% supplied`) + fact('Water', `${Math.round(d.water * 100)}% supplied`) + fact('Tax rate', `${effectiveTax(city,b)}%`);
    facts += fact('Land value', `${Math.round(d.landValue)} / 100`) + fact('Desirability', `${Math.round(d.desirability)} / 100`) + fact('Health / education', `${Math.round(d.health*100)}% / ${Math.round(b.education*100)}%`) + fact('Crime risk', `${Math.round(d.crime*100)}%`) + fact('Waste accumulation', `${Math.round(b.waste*100)}%`) + fact('Trip delay / productivity', `+${Math.round(d.commuteDelay*100)}% / ${Math.round(d.productivity*100)}%`);
    facts += fact('Parcel',`${i%city.size}, ${Math.floor(i/city.size)}`)+fact('Power / water demand',`${utilityNeed(b,'power').toFixed(1)} / ${utilityNeed(b,'water').toFixed(1)}`)+fact('Return trip to work',b.type==='residential'?(d.reachableJobs?'Available':'No reachable jobs'):'See worker occupancy');
    facts += fact('Density', `Tier ${b.density||1} / permitted ${c.density||1}`) + fact('Transit share', `${Math.round((d.transitShare||0)*100)}%`);
    if(b.type==='commercial')facts+=fact('Goods supplied',`${Math.round(d.goodsSupply*100)}%`);
    if(b.type==='industrial')facts+=fact('External trade',d.externalAccess?'Connected':'Local markets only');
    const missing = upgradeRequirements(city,b,d,m);
    note = b.level < 3 ? `Next level: ${missing.length ? missing.join(' · ') : 'Conditions met'}.` : 'This building has reached its maximum level.';
    facts += fact('Prosperous / struggling days', `${b.goodDays} / ${b.badDays}`);
    for (const [kind,label] of [['school','School'],['healthcare','Healthcare'],['police','Police'],['fire','Fire'],['garbage','Collection'],['park','Parks']]) facts += fact(`${label} coverage`, `${Math.round(d.coverage[kind]*100)}%`);
    problems = conditions(city, b, m); rename = b;
  } else if (f) {
    title = escapeHTML(f.name); const rule = FACILITIES[f.type], d = m.facilities.get(f.id), n = m.networks[d.component]; tag = rule.service ? 'PUBLIC SERVICES' : 'MUNICIPAL UTILITIES';
    note = rule.description;
    facts = fact('Facility', rule.label) + fact('State', d.active ? 'Operational' : 'Unserved') + fact('Road access', d.connected ? 'Connected' : 'Disconnected') +
      (rule.fleet ? fact('Supported bus fleet',rule.fleet) + fact('Power / water required',`${rule.usePower} / ${rule.useWater}`) : rule.service ? fact('Assigned load / capacity', rule.capacity ? `${Math.round(d.load)} / ${Math.round(d.capacity)}` : 'Open park') + fact('Reach', `${rule.radius} street steps`) + fact('Power / water required', `${rule.usePower||0} / ${rule.useWater||0}`) : fact('Capacity', rule.power || rule.water) + fact('Network demand', n ? Math.round(rule.power ? n.powerDemand : n.waterDemand) : 0)) + fact('Maintenance', `${money(rule.maintenance*(city.funding?.[rule.service]??1))} / month`);
    if(!rule.service&&!rule.fleet){facts+=fact('Power / water required',`${rule.usePower||0} / ${rule.useWater||0}`)+fact('Local emissions',rule.pollution||0);}
    if (d.connected && !d.active) problems.push('Restore spare power and water capacity on this road network.');
    if (!d.connected) problems.push('Connect a road to the facility perimeter.'); rename = f;
  } else if (c.road) {
    title = c.terrain === 'water' ? 'River crossing' : roadRule(c).label; tag = 'TRANSPORT NETWORK';
    facts = fact('Type', roadRule(c).label) + fact('Traffic load', `${Math.round(m.flow[i])} / ${roadRule(c).capacity}`) + fact('Travel delay', `+${Math.round(m.delay[i]*100)}%`) + fact('Maintenance', `$${roadRule(c).maintenance.toFixed(2)} / month`) + fact('Bus stop / signals', `${c.stop?'Yes':'No'} / ${c.signal?'Yes':'No'}`);
    note = 'Roads carry commute trips and distribute municipal power and water through their connected network.';
  } else if (c.zone) {
    title = `${ZONES[c.zone].label} parcel`; tag = 'ZONED LAND';
    note = 'Development needs direct road access, spare power and water capacity, and positive demand. Construction is privately funded.';
    facts = fact('Density tier', c.density||1) + fact('Demand', `${Math.round(city.demand[c.zone])}%`) + fact('Zone', ZONES[c.zone].label);
    problems=developmentNeeds(city,i,m);
    note=problems.length?'Waiting to develop. This parcel needs:':app.speed===0?'Ready to build. Press Play to let construction begin.':'Ready to build. Construction starts in batches; give the city a few days.';
  } else { note = c.terrain === 'water' ? 'Build a road across water to create a bridge. Other construction requires dry land.' : c.terrain === 'rock' ? 'A rocky ridge. Plan your streets around this terrain.' : 'Lay a road, zone nearby parcels, and provide electricity and water. Your city will grow from the conditions you create.'; facts = fact('Terrain', c.terrain === 'land' ? c.tree ? 'Woodland' : 'Grassland' : c.terrain === 'water' ? 'Water' : 'Rocky ridge') + fact('Coordinates', `${i % city.size}, ${Math.floor(i / city.size)}`); }
  if (!b && c.terrain === 'land') facts += fact('Land value', `${Math.round(m.fields.landValue[i])} / 100`) + fact('Housing desirability', `${Math.round(m.fields.desirability[i])} / 100`) + fact('Air / ground pollution', `${Math.round(m.fields.pollution[i])} / ${Math.round(m.fields.groundPollution[i])}`) + fact('Street noise', `${Math.round(m.fields.noise[i])} / 100`);
  const district=districtAt(city,i);if(district)facts+=fact('District',escapeHTML(district.name));
  $('inspector').hidden = false;
  // Leave the rename form alone while it has focus; simulation refreshes must not erase typing.
  if ($('inspector').contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  const inspectorScroll=$('inspector').scrollTop;
  $('inspector').innerHTML = `<div class="panel-heading"><div><span class="eyebrow" style="font-size:8px;letter-spacing:1px">${tag}</span><h3>${title}</h3></div><button class="close-button" aria-label="Close inspector">×</button></div>${note ? `<p>${note}</p>` : ''}<div class="facts">${facts}</div>${problems.map(p => `<div class="problem">! ${p}</div>`).join('')}${b && !problems.length ? '<div class="healthy">✓ Conditions support this building.</div>' : ''}${rename ? `<form class="rename-row"><input aria-label="Building name" maxlength="80" value="${escapeHTML(rename.name)}"><button>Rename</button></form>` : ''}`;
  $('inspector').scrollTop=inspectorScroll;
  $('inspector').querySelector('.close-button').onclick = () => { app.view.inspected = null; $('inspector').hidden = true; };
  const form = $('inspector').querySelector('form');
  if (form) form.onsubmit = e => { e.preventDefault(); rename.name = form.querySelector('input').value.trim() || rename.name; form.querySelector('input').blur(); inspector(app); toast('Name updated.'); };
}
function updateGuide(app) {
  $('guide').hidden = app.city.tutorialDismissed || !app.settings.tutorial;
  if ($('guide').hidden) return;
  const c = app.city, m = app.metrics;
  const steps = [
    { done: m.roads >= 8, title: 'A road is the beginning', text: 'Choose Road (2), then drag a short street across dry land. Roads also carry utility connections.' },
    { done: c.cells.some(c => c.zone === 'residential') && c.cells.some(c => c.zone === 'industrial'), title: 'Make room for a neighborhood', text: 'Zone housing (3) and industry (5) beside the road. Industry provides the first jobs. Buildings grow automatically.' },
    { done: m.power > 0 && m.water > 0, title: 'Connect the essentials', text: 'Place a wind station (6) and water tower (7) against the road. Each needs a clear 2 × 2 footprint.' },
    { done: m.population >= 30, title: 'Give the town a moment', text: 'Unpause and watch construction finish. Positive green demand brings residents; yellow demand brings jobs.' },
    { done: c.cells.some(c => c.zone === 'commercial') && m.net > 0, title: 'Bring the main street to life', text: 'Zone a few shops (4) near your homes. Open the budget by clicking your treasury; taxes fund maintenance.' },
    { done: c.facilities.some(f => f.type === 'garbage') && c.facilities.some(f => f.type === 'park'), title: 'Care for the neighborhood', text: 'Browse Services. Add a waste depot away from homes and a park nearby. Inspect coverage, capacity, and land value.' },
    { done: c.milestone >= 1 && c.facilities.some(f => f.type === 'school'), title: 'Invest in tomorrow', text: 'At 100 residents, Village status unlocks schools, a clinic, police, and fire protection. Education takes time; healthy, attractive neighborhoods can upgrade.' },
  ];
  const n = steps.findIndex(s => !s.done), step = steps[n] || { title: 'Your town is taking shape', text: 'Keep utilities ahead of demand. Explore map layers, inspect buildings, and save your city. Open Transport for bus routes and districts, or the City journal for local news. Use Map actions (P) to build by coordinates.' };
  if(n<0){$('guide').hidden=true;return;}
  const guideHTML = `<details ${app.guideOpen?'open':''}><summary><span class="guide-step">${n+1}</span>${step.title}<span class="guide-chevron">⌄</span></summary><div class="panel-heading"><small>THE MAYOR’S FIELD GUIDE</small><button class="close-button" aria-label="Dismiss tutorial">×</button></div><h3>${step.title}</h3><p>${step.text}</p><span class="guide-count">${n < 0 ? 'Field guide complete' : `Step ${n + 1} of ${steps.length}`}</span></details>`;
  if(app.guideMarkup!==guideHTML){app.guideMarkup=guideHTML;$('guide').innerHTML=guideHTML;
  $('guide').querySelector('details').ontoggle=e=>{app.guideOpen=e.target.open;if(e.target.open)$('city-tools').open=false;};}
  $('guide').querySelector('button').onclick = () => { c.tutorialDismissed = true; $('guide').hidden = true; };
}
function updateAlerts(app) {
  const m = app.metrics, alerts = [];
  for (const incident of app.city.incidents) { const b = app.city.buildings.find(b => b.id === incident.buildingId); alerts.push({ text: `Fire at ${b.name}. ${incident.responderId ? 'Crews responding.' : 'No reachable fire crew.'}`, cell:b.cell }); }
  if (m.abandoned) alerts.push({ text: `${m.abandoned} abandoned buildings. Restore neighborhood conditions.`, cell:app.city.buildings.find(b=>b.status==='abandoned').cell });
  const waste = app.city.buildings.find(b=>b.waste>.4);
  if (waste) alerts.push({ text:'Waste is accumulating. Improve collection coverage and capacity.',cell:waste.cell });
  if (m.averageDelay>.3) alerts.push({ text:`Commutes take ${Math.round(m.averageDelay*100)}% longer. Plan shorter routes or distribute workplaces.` });
  if (m.shortage) alerts.push({ text: `${m.shortage} building${m.shortage > 1 ? 's' : ''} need road access or utilities.`, cell: app.city.buildings.find(b => { const d = m.details.get(b.id); return !d.connected || d.power < .95 || d.water < .95; })?.cell });
  if (m.net < 0 && m.roads) alerts.push({ text: `Monthly deficit: ${money(m.net)}. Grow your tax base.`, action: () => budget(app) });
  if (m.unemployment > .2 && m.population > 40) alerts.push({ text: `${Math.round(m.unemployment * 100)}% unemployed. Zone accessible workplaces.` });
  if (m.powerDemand > m.power * .85 && m.power) alerts.push({ text: 'Electricity capacity is nearly full. Add a wind station.' });
  if (m.waterDemand > m.water * .85 && m.water) alerts.push({ text: 'Water capacity is nearly full. Add a water tower.' });
  if (app.city.treasury < 3000) alerts.push({ text: 'Treasury is low. Review taxes and monthly expenses.', action: () => budget(app) });
  $('alerts').hidden=!app.alertsOpen;
  $('alerts-toggle').textContent=alerts.length?`◉ ${alerts.length} city notice${alerts.length===1?'':'s'}`:'✓ City running';
  $('alerts-toggle').classList.toggle('has-alerts',alerts.length>0);
  $('alerts-toggle').setAttribute('aria-expanded',String(!!app.alertsOpen));
  if(!alerts.length){app.alertMarkup=null;$('alerts').textContent='No city issues right now.';return;}
  const alertMarkup=JSON.stringify(alerts.map(a=>[a.text,a.cell]));
  if(app.alertMarkup===alertMarkup)return;app.alertMarkup=alertMarkup;
  $('alerts').replaceChildren(...alerts.map(a => {
    const button = document.createElement('button'); button.className = 'alert'; button.textContent = `! ${a.text}`;
    button.onclick = () => { if (a.action) a.action(); else if (a.cell != null) { app.alertsOpen=false;$('alerts').hidden=true;$('alerts-toggle').setAttribute('aria-expanded','false');app.view.inspected = a.cell; app.camera.focus(a.cell % app.city.size, Math.floor(a.cell / app.city.size)); inspector(app); } };
    return button;
  }));
}
function chart(history, key, color) {
  history = history.filter(h => Number.isFinite(h[key]));
  if (history.length < 2) return '<p class="dialog-note">History begins after two monthly reports. Let the city run.</p>';
  const values = history.map(h => h[key]), min = Math.min(0, ...values), max = Math.max(1, ...values), span = max - min || 1;
  const points = values.map((v, i) => `${10 + i / (values.length - 1) * 600},${100 - (v - min) / span * 85}`).join(' ');
  return `<svg viewBox="0 0 620 115" preserveAspectRatio="none" role="img" aria-label="Monthly ${key} history"><path d="M10 100H610M10 58H610M10 15H610" stroke="#e0e5d6" stroke-width="1"/><polygon points="10,100 ${points} 610,100" fill="${color}15"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg><div class="chart-labels"><span>${date(history[0].day)}</span><span>Range: ${Math.round(min).toLocaleString()} – ${Math.round(max).toLocaleString()}</span><span>${date(history.at(-1).day)}</span></div>`;
}
export function statistics(app, section = 'growth') {
  const m = app.metrics, h = app.city.history;
  const sections = { growth:'Growth', services:'Services', quality:'Quality of life', economy:'Economy & travel', transport:'Transport & trade' };
  const sets = {
    growth: [['population','Population'],['jobs','Employment capacity'],['abandoned','Abandoned buildings']],
    quality: [['health','Health (%)'],['education','Education (%)'],['landValue','Land value'],['crime','Crime risk (%)'],['pollution','Map-average air pollution']],
    economy: [['treasury','Municipal treasury'],['income','Tax and fare revenue'],['expenses','Maintenance expenses'],['commuteDelay','Average commute delay (%)'],['traffic','Peak traffic / capacity']],
    transport: [['ridership','Bus riders'],['transitDemand','Potential bus riders'],['fareRevenue','Fare revenue'],['imports','Imported goods'],['exports','Exported goods']],
    services: [['garbage','Waste collection coverage (%)'],['power','Electricity demand'],['water','Water demand']],
  };
  let facts = section === 'growth' ? fact('Workforce / employed', `${m.workforce} / ${m.employed}`) + fact('Vacant jobs',m.vacancies) + fact('Occupied housing / capacity',`${m.population} / ${m.housing}`) + fact('Next stage',STAGE_POPULATION[app.city.milestone+1] ? `${STAGES[app.city.milestone+1]} · ${STAGE_POPULATION[app.city.milestone+1].toLocaleString()} residents` : 'Metropolis') : section === 'quality' ? fact('Health / education',`${Math.round(m.health*100)}% / ${Math.round(m.education*100)}%`) + fact('Land value / crime risk',`${Math.round(m.landValue)} / ${Math.round(m.crime*100)}%`) : section === 'economy' ? fact('Average commute delay',`+${Math.round(m.averageDelay*100)}%`) + fact('Current income / expenses',`${money(m.income)} / ${money(m.expenses)}`) : fact('Power demand / capacity',`${Math.round(m.powerDemand)} / ${m.power}`) + fact('Water demand / capacity',`${Math.round(m.waterDemand)} / ${m.water}`) + fact('Effective collection coverage',`${Math.round(m.garbageCollection*100)}%`);
  if(section==='transport')facts=fact('Bus fleet / assigned',`${m.transit.fleet} / ${m.transit.usedFleet}`)+fact('External gateways',m.trade.gateways)+fact('Shops lacking goods',m.trade.disconnectedShops);
  if (section === 'services') facts += app.city.facilities.filter(f=>FACILITIES[f.type].service).map(f=>{ const d=m.facilities.get(f.id),r=FACILITIES[f.type]; return fact(escapeHTML(f.name),`${d.active?'Active':'Unserved'} · ${r.capacity ? `${Math.round(d.load)} / ${r.capacity}` : 'Open park'}`); }).join('');
  showDialog('The city, in numbers', 'Monthly reports from your actual simulation. Open again to refresh.', `<nav class="stats-tabs">${Object.entries(sections).map(([id,name])=>`<button data-stat-section="${id}" class="${id===section?'active':''}">${name}</button>`).join('')}</nav><div class="stats-grid"><div class="stat-card"><span>RESIDENTS</span><strong>${m.population.toLocaleString()}</strong></div><div class="stat-card"><span>JOBS</span><strong>${m.jobs.toLocaleString()}</strong></div><div class="stat-card"><span>UNEMPLOYMENT</span><strong>${Math.round(m.unemployment*100)}%</strong></div></div><div class="facts">${facts}</div>${sets[section].map(([key,label],n)=>`<div class="chart-card"><h3>${label}</h3>${chart(h,key,['#648b69','#6b99a2','#ad9258'][n%3])}</div>`).join('')}<p class="dialog-note">Last 240 monthly reports. New indicators begin when a Phase 1 city is loaded into this edition. Crime and health are risk and wellbeing indices; traffic measures sampled, routed commute volume.</p>`,true);
  document.querySelectorAll('[data-stat-section]').forEach(button=>{button.onclick=()=>statistics(app,button.dataset.statSection);});
}
export function budget(app) {
  const m = app.metrics;
  showDialog('A balanced foundation', 'Taxes support public infrastructure. Higher rates reduce demand and migration.', `<div class="stats-grid"><div class="stat-card"><span>MONTHLY INCOME</span><strong class="positive">${money(m.income)}</strong></div><div class="stat-card"><span>MONTHLY EXPENSES</span><strong>${money(m.expenses)}</strong></div><div class="stat-card"><span>NET CASH FLOW</span><strong class="${m.net >= 0 ? 'positive' : 'negative'}">${money(m.net)}</strong></div></div><div class="section-label">TAX RATES</div>${Object.entries(ZONES).map(([type, rule]) => `<label class="tax-row"><span>${rule.label}</span><input type="range" min="0" max="20" step="1" value="${app.city.taxes[type]}" data-tax="${type}" aria-label="${rule.label} tax rate"><output>${app.city.taxes[type]}%</output></label>`).join('')}<div class="facts" style="margin-top:20px">${fact('Road maintenance', `${money(m.roadExpenses)} / month`)}${fact('Bus operation and stops', `${money(m.transportExpenses)} / month`)}${fact('Bus fares', `${money(m.transit.revenue)} / month`)}${fact('Utility maintenance', `${money(m.utilityExpenses)} / month`)}${fact('Public service maintenance', `${money(m.serviceExpenses)} / month`)}${fact('Last monthly payment', `${money(app.city.ledger.net)}`)}${fact('Treasury', money(app.city.treasury))}</div><p class="dialog-note">Accounts settle every 30 simulation days. Figures above project the current monthly rate. The game pauses while a dialog is open.</p>`);
  document.querySelectorAll('[data-tax]').forEach(input => { input.oninput = () => {
    app.city.taxes[input.dataset.tax] = Number(input.value);
    input.nextElementSibling.textContent = `${input.value}%`; app.refresh();
    const m = app.metrics;
    document.querySelectorAll('#dialog .stat-card strong').forEach((number, i) => {
      number.textContent = money([m.income, m.expenses, m.net][i]);
      if (i === 2) number.className = m.net >= 0 ? 'positive' : 'negative';
    });
  }; });
}
export function saveManager(app) {
  const slots = ['1', '2', '3', 'auto'];
  let html = '';
  for (const slot of slots) {
    let metadata = 'Empty slot', canLoad = false;
    try { const raw = localStorage.getItem(`citysim.save.${slot}`); if (raw) {
      const data = deserialize(raw); canLoad = true;
      metadata = `${escapeHTML(data.city.name)} · ${date(data.city.day)}<br>${new Date(data.savedAt).toLocaleString()} · ${money(data.city.treasury)}`;
    } } catch { metadata = 'Damaged or unsupported save. Use another slot.'; }
    html += `<div class="save-row"><div><strong>${slot === 'auto' ? 'Autosave' : `City slot ${slot}`}</strong><small>${metadata}</small></div><div class="slot-actions">${app.inGame && slot !== 'auto' ? `<button data-save="${slot}">Save</button>` : ''}<button data-load="${slot}" ${!canLoad ? 'disabled' : ''}>Load</button></div></div>`;
  }
  showDialog('Keep your city close', 'Three city slots, an autosave, and portable JSON backups.', html + `<div class="dialog-actions"><button id="import-save">Import file</button>${app.inGame ? '<button id="export-save" class="primary">Export current city</button>' : ''}</div><p class="dialog-note">Saves stay in this browser on this address. Export a backup before clearing browser data. Saving to an occupied slot replaces that slot.</p>`);
  document.querySelectorAll('[data-save]').forEach(b => { b.onclick = () => { if (app.save(b.dataset.save)) saveManager(app); }; });
  document.querySelectorAll('[data-load]').forEach(b => { b.onclick = () => {
    try { const data = deserialize(localStorage.getItem(`citysim.save.${b.dataset.load}`)); app.start(data.city); $('dialog').close(); toast('City loaded. Welcome back, Mayor.'); }
    catch (e) { toast(e.message, true); }
  }; });
  $('import-save').onclick = () => $('import-file').click();
  if ($('export-save')) $('export-save').onclick = () => {
    try {
      const blob = new Blob([serialize(app.city)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = `${app.city.name.replace(/[^a-z0-9_-]/gi, '_')}-day-${app.city.day}.citysim.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('City backup download requested.');
    } catch (e) { toast(e.message, true); }
  };
}
export function settings(app) {
  const s = app.settings;
  showDialog('Make yourself at home', 'Preferences are saved on this device.', `<div class="settings-section"><span class="section-label">CAMERA & DISPLAY</span><label class="settings-row">Camera speed<div><input data-setting="cameraSpeed" type="range" min=".5" max="2" step=".1" value="${s.cameraSpeed}"><output>${s.cameraSpeed}×</output></div></label><label class="settings-row">Interface scale<select data-setting="uiScale">${[.85, 1, 1.1].map(v => `<option value="${v}" ${v === s.uiScale ? 'selected' : ''}>${Math.round(v * 100)}%</option>`).join('')}</select></label><label class="settings-row">Edge scrolling<input data-setting="edgeScroll" type="checkbox" ${s.edgeScroll ? 'checked' : ''}></label><label class="settings-row">Reduced motion<input data-setting="reducedMotion" type="checkbox" ${s.reducedMotion ? 'checked' : ''}></label></div><div class="settings-section"><span class="section-label">ATMOSPHERE & ACCESSIBILITY</span><label class="settings-row">Lighting<select data-setting="lighting">${['auto','day','night'].map(v=>`<option value="${v}" ${s.lighting===v?'selected':''}>${{auto:'Automatic cycle',day:'Always daylight',night:'Always night'}[v]}</option>`).join('')}</select></label><label class="settings-row">Weather effects<input data-setting="weather" type="checkbox" ${s.weather?'checked':''}></label><label class="settings-row">High contrast interface<input data-setting="contrast" type="checkbox" ${s.contrast?'checked':''}></label><span class="section-label">SOUND</span><label class="settings-row">Ambient sound<div><input data-setting="ambientVolume" type="range" min="0" max="1" step=".05" value="${s.ambientVolume}"><output>${Math.round(s.ambientVolume*100)}%</output></div></label><label class="settings-row">Interface & construction volume<div><input data-setting="volume" type="range" min="0" max="1" step=".05" value="${s.volume}"><output>${Math.round(s.volume * 100)}%</output></div></label></div><div class="settings-section"><span class="section-label">CITY MANAGEMENT</span><label class="settings-row">Autosave interval<select data-setting="autosave">${[0, 1, 2, 5].map(v => `<option value="${v}" ${v === s.autosave ? 'selected' : ''}>${v ? `${v} minute${v > 1 ? 's' : ''}` : 'Off'}</option>`).join('')}</select></label><label class="settings-row">Contextual field guide<input data-setting="tutorial" type="checkbox" ${s.tutorial ? 'checked' : ''}></label></div><p class="dialog-note">The window controls display resolution. Original synthesized sounds require no asset downloads. Ambience starts after an interaction and fades out when paused, in dialogs, or in a hidden tab. Reduced motion freezes environmental animation and hides vehicle animation.</p>`);
  document.querySelectorAll('[data-setting]').forEach(input => { input.oninput = () => {
    s[input.dataset.setting] = input.type === 'checkbox' ? input.checked : input.dataset.setting==='lighting'?input.value:Number(input.value);
    if (input.nextElementSibling?.tagName === 'OUTPUT') input.nextElementSibling.textContent = ['volume','ambientVolume'].includes(input.dataset.setting) ? `${Math.round(Number(input.value) * 100)}%` : `${input.value}×`;
    app.applySettings();
    if (s.tutorial) app.city.tutorialDismissed = false;
    if (app.inGame) app.refresh();
  }; });
}
export function cityMenu(app) {
  showDialog(escapeHTML(app.city.name), 'Your municipal desk.', `<nav class="menu-list"><button id="resume-city" class="primary">Return to the city</button><button id="desk-save">Save & load</button><button id="desk-settings">Settings</button><button id="desk-history">City timeline</button><button id="desk-help">Controls & field guide</button><button id="return-menu">Save and return to main menu</button></nav>`);
  $('resume-city').onclick = () => $('dialog').close(); $('desk-save').onclick = () => saveManager(app); $('desk-settings').onclick = () => settings(app);
  $('desk-history').onclick = () => showDialog('The story so far', 'Moments from your city’s own simulation.', app.city.timeline.slice().reverse().map(e => `<div class="timeline-row"><b>Day ${e.day}</b><span>${escapeHTML(e.text)}</span></div>`).join(''));
  $('desk-help').onclick = () => showDialog('The mayor’s toolkit', 'Build conditions. Watch the city respond.', `<div class="help-controls"><span><kbd>WASD / arrows</kbd> — pan</span><span><kbd>Scroll</kbd> — zoom at cursor</span><span><kbd>Right / middle drag</kbd> — pan</span><span><kbd>Space</kbd> — pause</span><span><kbd>1–9</kbd> — select tools</span><span><kbd>Escape</kbd> — inspector</span><span><kbd>Ctrl+S</kbd> — save manager</span><span><kbd>G</kbd> — statistics</span><span><kbd>Home</kbd> — center map</span><span><kbd>F3</kbd> — debug display</span><span><kbd>P</kbd> — map actions by coordinates</span></div><p class="dialog-note">Roads distribute power and water within each connected network. Zone directly beside them. Add industry for jobs, housing for workers, and shops once population grows. Green, blue, and yellow bars indicate RCI demand. Utility facilities reserve capacity for construction. Open an inspector to diagnose shortages.</p><div class="dialog-actions"><button id="restart-guide" class="primary">Show field guide</button></div>`);
  $('desk-help').addEventListener('click', () => { $('restart-guide').onclick = () => { app.city.tutorialDismissed = false; app.settings.tutorial = true; app.applySettings(); app.refresh(); $('dialog').close(); }; });
  $('return-menu').onclick = () => { if (app.save('auto')) { app.returnToMenu(); $('dialog').close(); } };
}
