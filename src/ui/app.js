import { journal, mapActions } from './journal.js';
import { atmosphere } from '../simulation/life.js';
import { Ambience } from './audio.js';
import { createCity } from '../simulation/world.js';
import { tick } from '../simulation/city.js';
import { measure } from '../simulation/metrics.js';
import { serialize, deserialize } from '../simulation/save.js';
import { clamp, FACILITIES, STAGES, ZONING_TOOLS } from '../simulation/rules.js';
import { Camera } from '../render/camera.js';
import { Renderer } from '../render/renderer.js';
import { showcase } from './showcase.js';
import { TOOLS, icon } from './icons.js';
import { LAYERS } from './layers.js';
import { setupInput } from './input.js';
import { serviceCatalog, zoningCatalog } from './civic.js';
import { mobility, TRANSPORT_TOOLS } from './mobility.js';
import { $, toast, showDialog, updateHUD, statistics, budget, saveManager, settings, cityMenu } from './panels.js';

const preferences = { lighting:'auto', weather:true, contrast:false, ambientVolume:0, cameraSpeed:1, uiScale:1, edgeScroll:false, reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches, volume:.25, autosave:2, tutorial:true };
try {
  const saved = JSON.parse(localStorage.getItem('citysim.settings') || '{}');
  if(['auto','day','night'].includes(saved.lighting))preferences.lighting=saved.lighting;
  for (const key of ['edgeScroll','reducedMotion','tutorial','weather','contrast']) if (typeof saved[key] === 'boolean') preferences[key] = saved[key];
  for (const [key,min,max] of [['cameraSpeed',.5,2],['uiScale',.85,1.1],['volume',0,1],['ambientVolume',0,1],['autosave',0,5]]) if (Number.isFinite(saved[key])) preferences[key] = clamp(saved[key],min,max);
} catch { /* Defaults survive unavailable storage or malformed preferences. */ }
const ambience=new Ambience();
const demo = showcase(), camera = new Camera(), renderer = new Renderer($('world'), camera);
const app = {
  city:demo, metrics:measure(demo), camera, renderer, settings:preferences, inGame:false, speed:1, tool:'inspect', accumulator:0,
  routeDraft:[], activeDistrict:null, lastAutosave:performance.now(), milestone:0,
  view:{overlay:'none',preview:null,inspected:null,debug:false,reducedMotion:false,fps:60,tickMs:0},
  openMapActions(){mapActions(this);},
  refresh() { this.metrics=measure(this.city); if(this.inGame)updateHUD(this); },
  start(city) {
    this.city=city;this.inGame=true;this.guideOpen=false;this.guideMarkup=null;this.alertMarkup=null;this.alertsOpen=false;$('city-tools').open=false;this.accumulator=0;this.routeDraft=[];this.activeDistrict=null;this.milestone=city.milestone;this.lastNewsDay=city.day;this.lastAutosave=performance.now();
    this.view.overlay='none';this.view.preview=null;this.view.inspected=null;
    $('overlay-select').value='none';$('legend').hidden=true;$('inspector').hidden=true;$('menu').hidden=true;$('hud').hidden=false;
    camera.targetZoom=camera.zoom=1;camera.focus(24,25);camera.x=camera.targetX;camera.y=camera.targetY;
    this.selectTool('inspect');this.setSpeed(1);this.refresh();
  },
  returnToMenu() { this.inGame=false;this.city=demo;this.metrics=measure(demo);this.view.overlay='none';this.view.preview=null;this.view.inspected=null;$('hud').hidden=true;$('menu').hidden=false;camera.targetZoom=1.18;camera.focus(23,28);camera.targetX+=innerWidth*.16; },
  selectTool(id) {
    this.tool=id;$('hud').classList.toggle('is-building',id!=='inspect');if(id!=='inspect'){this.view.inspected=null;$('inspector').hidden=true;}$('city-tools').open=false;const f=FACILITIES[id], t=(ZONING_TOOLS[id]?{name:ZONING_TOOLS[id].name,category:'Zoning',hint:`$${ZONING_TOOLS[id].cost} / parcel · Density tier ${ZONING_TOOLS[id].tier}. Drag beside roads; buildings develop with demand and services.`}:null)||TOOLS.find(t=>t.id===id)||TRANSPORT_TOOLS[id]||{name:f?.label||id,category:'Municipal services',hint:f?.description||''};
    $('tool-name').textContent=t.name;$('tool-category').textContent=t.category;$('tool-hint').textContent=t.hint;
    document.querySelectorAll('[data-tool]').forEach(b=>{b.classList.toggle('active',b.dataset.tool===(ZONING_TOOLS[id]?.zone||id));b.setAttribute('aria-pressed',String(b.dataset.tool===(ZONING_TOOLS[id]?.zone||id)));});
    $('services-button')?.classList.toggle('active',!!f?.service);$('world').style.cursor=id==='inspect'?'default':'crosshair';this.view.preview=null;$('cost-preview').textContent='';
  },
  setSpeed(speed) { this.speed=speed;document.querySelectorAll('[data-speed]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.speed)===speed);b.setAttribute('aria-pressed',String(Number(b.dataset.speed)===speed));}); },
  save(slot) { try { localStorage.setItem(`citysim.save.${slot}`,serialize(this.city));if(slot!=='auto')toast('City saved.');return true; }catch(error){toast(`Unable to save: ${error.message}`,true);return false;} },
  applySettings() { document.documentElement.style.setProperty('--ui-scale',this.settings.uiScale);this.view.reducedMotion=this.settings.reducedMotion;this.view.lighting=this.settings.lighting;this.view.weather=this.settings.weather;document.body.classList.toggle('high-contrast',this.settings.contrast);document.body.classList.toggle('reduce-motion',this.settings.reducedMotion);try{localStorage.setItem('citysim.settings',JSON.stringify(this.settings));}catch{toast('Preferences could not be stored on this device.',true);} },
  sound(frequency) { if(!this.settings.volume)return;try{this.audio ||= new AudioContext();this.audio.resume();const oscillator=this.audio.createOscillator(),gain=this.audio.createGain(),now=this.audio.currentTime;oscillator.frequency.value=frequency;gain.gain.setValueAtTime(this.settings.volume*.12,now);gain.gain.exponentialRampToValueAtTime(.001,now+.12);oscillator.connect(gain).connect(this.audio.destination);oscillator.start();oscillator.stop(now+.13);}catch{} },
};
$('toolbar').innerHTML=TOOLS.map((t,n)=>`${[2,5,7].includes(n)?'<span class="toolbar-divider"></span>':''}<button class="tool-button" data-tool="${t.id}" title="${t.name} (${t.key})">${icon(t.id)}<span>${t.name}<small>${t.cost}</small></span></button>`).join('')+`<span class="toolbar-divider"></span><button id="services-button" class="tool-button" title="Government, services and infrastructure">${icon('services')}<span>Government<small>City facilities</small></span></button>`;
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{const id=b.dataset.tool;if(ZONING_TOOLS[id])zoningCatalog(app,id);else if(['wind','water'].includes(id))serviceCatalog(app,id==='wind'?'power':'water');else app.selectTool(id);});
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>app.setSpeed(Number(b.dataset.speed)));
$('alerts-toggle').onclick=()=>{app.alertsOpen=!app.alertsOpen;if(app.alertsOpen){app.view.inspected=null;$('inspector').hidden=true;}updateHUD(app);};
$('city-tools').ontoggle=e=>{if(e.target.open&&app.guideOpen){app.guideOpen=false;updateHUD(app);}};
$('services-button').onclick=$('government-hub').onclick=()=>serviceCatalog(app);
$('save-button').insertAdjacentHTML('afterend','<button id="mobility-button" title="Transport and districts">⇄ Transport</button>');
$('mobility-button').insertAdjacentHTML('afterend','<button id="journal-button">City journal</button><button id="map-actions-button" title="Keyboard map actions (P)">Map actions</button>');
$('journal-button').onclick=()=>journal(app);$('map-actions-button').onclick=()=>mapActions(app);
$('mobility-button').onclick=()=>mobility(app,app.routeDraft.length?'transit':'roads');
$('stats-button').onclick=$('population-button').onclick=()=>statistics(app);
$('save-button').onclick=$('load-city').onclick=()=>saveManager(app);
$('money-button').onclick=()=>budget(app);$('city-menu').onclick=()=>cityMenu(app);$('menu-settings').onclick=()=>settings(app);
$('zoom-in').onclick=()=>camera.zoomAt(1.2,innerWidth/2,innerHeight/2);$('zoom-out').onclick=()=>camera.zoomAt(1/1.2,innerWidth/2,innerHeight/2);$('home-camera').onclick=()=>camera.focus(24,25);
$('overlay-select').insertAdjacentHTML('beforeend',`<optgroup label="City conditions">${Object.entries(LAYERS).map(([id,l])=>`<option value="${id}">${l.label}</option>`).join('')}</optgroup><optgroup label="Transport and districts"><option value="transit">Bus network</option><option value="freight">Freight traffic</option><option value="districts">Districts</option></optgroup>`);
$('overlay-select').onchange=()=>{const value=$('overlay-select').value;app.view.overlay=value;const legend=$('legend');legend.hidden=value==='none';legend.textContent=value==='zoning'?'Green: homes · blue: shops · yellow: industry · violet: offices':value==='districts'?'District colors identify painted parcels.':value==='transit'?'Gold routes · blue stop markers':value==='freight'?'Green → red: freight volume':`${LAYERS[value]?.label||value}: green → red ${LAYERS[value]?.bad?'low → high':'good → poor'}`;};
$('new-city').onclick=()=>{
  showDialog('A new beginning','Every great city starts with a small decision.',`<form id="new-city-form"><div class="form-grid"><label class="field"><span>CITY NAME</span><input name="name" value="Willow Bay" maxlength="32" required></label><label class="field"><span>WORLD SEED</span><input name="seed" value="willow" maxlength="64" required></label><label class="field"><span>LANDSCAPE</span><select name="terrain"><option value="river">River valley</option><option value="coast">Coastal plain</option><option value="plains">Open plains</option></select></label><label class="field"><span>DIFFICULTY</span><select name="difficulty"><option value="standard">Standard · $45,000</option><option value="relaxed">Relaxed · $80,000</option><option value="challenging">Challenging · $25,000</option></select></label></div><p class="dialog-note">Start on undeveloped land. Build a road, connect power and water, then zone housing and workplaces. Your seed reproduces the same terrain.</p><div class="dialog-actions"><button class="primary">Found city</button></div></form>`);
  $('new-city-form').onsubmit=e=>{e.preventDefault();app.start(createCity(Object.fromEntries(new FormData(e.target))));$('dialog').close();toast('Your city charter is signed. Start with a road.');};
};
$('credits').onclick=()=>showDialog('Built from small things','CitySim · The City Lives', '<p class="dialog-note">Original procedural art, synthesized interface sounds, and a deterministic city simulation. Built with JavaScript and Canvas. No downloaded art, music, or third-party runtime dependencies.</p>');
$('import-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>8*1024*1024)throw new Error('Save exceeds the 8 MB limit.');app.start(deserialize(await file.text()).city);$('dialog').close();toast('City imported.');}catch(error){toast(error.message,true);}finally{e.target.value='';}};
setupInput(app,$('world'));app.applySettings();app.returnToMenu();camera.x=camera.targetX;camera.y=camera.targetY;camera.zoom=camera.targetZoom;
let previous=performance.now(),visualTime=0,frames=0,fpsStart=previous;
function frame(now){
  const dt=Math.min(.1,(now-previous)/1000);previous=now;app.inputFrame(dt);camera.update(dt,app.settings.reducedMotion);if(!app.settings.reducedMotion)visualTime+=dt;
  if(app.inGame&&!$('dialog').open&&!document.hidden){
    app.accumulator+=dt*app.speed;let steps=0;const started=performance.now();
    while(app.accumulator>=.25&&steps<8){tick(app.city);app.accumulator-=.25;steps++;}
    if(steps){const latest=app.city.life.news.at(-1);if(latest&&latest.day>app.lastNewsDay){app.lastNewsDay=latest.day;}
      app.view.tickMs=(performance.now()-started)/steps;app.refresh();if(app.city.milestone>app.milestone){app.milestone=app.city.milestone;toast(`Welcome to ${STAGES[app.milestone]}! New facilities are available.`);}}
    if(app.settings.autosave&&now-app.lastAutosave>app.settings.autosave*60000){app.save('auto');app.lastAutosave=now;}
  }
  frames++;if(now-fpsStart>=1000){app.view.fps=frames*1000/(now-fpsStart);frames=0;fpsStart=now;}
  const sky=atmosphere(app.city,app.settings.lighting);ambience.update(app.settings.ambientVolume,sky.darkness,app.inGame&&!document.hidden&&!$('dialog').open&&app.speed>0);
  app.view.trafficPaused=app.inGame&&(app.speed===0||$('dialog').open||document.hidden);
  renderer.draw(app.city,app.metrics,app.view,visualTime);requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)ambience.update(0,0,false);});
document.addEventListener('pointerdown',()=>{if(app.settings.ambientVolume>0)ambience.unlock();});
document.addEventListener('keydown',()=>{if(app.settings.ambientVolume>0)ambience.unlock();});
requestAnimationFrame(frame);
