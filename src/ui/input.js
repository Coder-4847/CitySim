import { selection, planBuild, build } from '../simulation/build.js';
import { developmentNeeds } from '../simulation/development.js';
import { ZONES } from '../simulation/rules.js';
import { TOOLS } from './icons.js';
import { $, toast, money, statistics, saveManager, inspector } from './panels.js';

export function setupInput(app, canvas) {
  const keys = new Set(); let pointer = null, drag = null;
  function preview() {
    if (!app.inGame || ['inspect','routeStop'].includes(app.tool) || !pointer || drag?.pan) { app.view.preview = null; $('cost-preview').textContent = ''; return; }
    const end = app.camera.pick(pointer.x, pointer.y, app.city.size);
    if (end == null) { app.view.preview = null; $('cost-preview').textContent = 'Outside map'; return; }
    const indices = selection(app.city, drag?.start ?? end, end, app.tool);
    app.view.preview = planBuild(app.city, app.tool, indices, {districtId:app.activeDistrict});
    $('cost-preview').textContent = app.view.preview.valid ? `${app.view.preview.changes.length} parcels · ${money(app.view.preview.cost)}` : app.view.preview.reason;
    $('cost-preview').className = app.view.preview.valid ? '' : 'negative';
  }
  canvas.oncontextmenu = e => e.preventDefault();
  canvas.addEventListener('pointerdown', e => {
    if (!app.inGame || $('dialog').open) return;
    canvas.setPointerCapture(e.pointerId);
    pointer = { x: e.clientX, y: e.clientY };
    drag = { pan: e.button === 1 || e.button === 2 || e.altKey, start: app.camera.pick(e.clientX, e.clientY, app.city.size), x: e.clientX, y: e.clientY };
    if (drag.pan) canvas.style.cursor = 'grabbing'; preview();
  });
  canvas.addEventListener('pointermove', e => {
    pointer = { x: e.clientX, y: e.clientY };
    if (drag?.pan) { app.camera.pan(e.clientX - drag.x, e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; }
    preview();
  });
  canvas.addEventListener('pointerup', e => {
    if (!drag) return;
    if (!drag.pan && app.inGame && !$('dialog').open) {
      const end = app.camera.pick(e.clientX, e.clientY, app.city.size);
      if (end != null && drag.start != null) {
        if (app.tool === 'inspect') { app.view.inspected = app.renderer.pickObject(e.clientX, e.clientY) ?? end; inspector(app); }
        else if(app.tool === 'routeStop') {
          if(!app.city.cells[end].stop) toast('Choose a bus stop on a street.',true);
          else if(app.routeDraft.includes(end)) toast('That stop is already in the route.',true);
          else if(app.routeDraft.length>=24) toast('A route can have at most 24 stops.',true);
          else { app.routeDraft.push(end);toast(`Stop ${app.routeDraft.length} added. Open Transport to finish the route.`); }
        }
        else {
          const result = build(app.city, app.tool, selection(app.city, drag.start, end, app.tool), {districtId:app.activeDistrict});
          if (!result.valid) toast(result.reason, true);
          else { app.sound(app.tool === 'bulldoze' ? 140 : 400); app.refresh();
            const i=result.changes[0];
            if(ZONES[app.city.cells[i]?.zone]){const needs=developmentNeeds(app.city,i,app.metrics);toast(`${result.changes.length} parcels zoned${result.skipped?`; ${result.skipped} protected or unchanged`:''}. ${needs.length?'Next: '+needs[0]+'.':app.speed===0?'Press Play to begin construction.':'Ready for development.'}`);}
          }
        }
      }
    }
    drag = null; pointer = null; canvas.style.cursor = app.tool === 'inspect' ? 'default' : 'crosshair'; preview();
  });
  canvas.addEventListener('pointercancel', () => { drag = null; pointer = null; preview(); });
  canvas.addEventListener('pointerleave', () => { if (!drag) { pointer = null; preview(); } });
  canvas.addEventListener('wheel', e => { if (!app.inGame || $('dialog').open) return; e.preventDefault(); app.camera.zoomAt(Math.exp(-e.deltaY * .0015), e.clientX, e.clientY); }, { passive: false });
  window.addEventListener('blur', () => { keys.clear(); drag = null; pointer = null; app.view.preview = null; });
  document.addEventListener('keydown', e => {
    if ((e.target.tagName==='BUTTON'&&e.key===' ') || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || $('dialog').open || !app.inGame) return;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F3'].includes(e.key)) e.preventDefault();
    if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); saveManager(app); return; }
    keys.add(e.key.toLowerCase());
    if (e.repeat) return;
    if (e.key === ' ') app.setSpeed(app.speed ? 0 : 1);
    if (e.key === 'Escape') { app.selectTool('inspect'); app.view.inspected = null; $('inspector').hidden = true; }
    if (e.key === 'F3') app.view.debug = !app.view.debug;
    if (e.key === 'Home') app.camera.focus(25, 25);
    if (e.key.toLowerCase() === 'p') app.openMapActions();
    if (e.key.toLowerCase() === 'g') statistics(app);
    const tool = TOOLS.find(t => t.key === e.key); if (tool && !e.ctrlKey && !e.altKey) app.selectTool(tool.id);
  });
  document.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  app.inputFrame = dt => {
    if (!app.inGame || $('dialog').open) return;
    let dx = 0, dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy++;
    if (keys.has('s') || keys.has('arrowdown')) dy--;
    if (keys.has('a') || keys.has('arrowleft')) dx++;
    if (keys.has('d') || keys.has('arrowright')) dx--;
    if (app.settings.edgeScroll && pointer && !drag) {
      if (pointer.x < 12) dx++; if (pointer.x > window.innerWidth - 12) dx--;
      if (pointer.y < 12) dy++; if (pointer.y > window.innerHeight - 12) dy--;
    }
    app.camera.pan(dx * dt * 600 * app.settings.cameraSpeed, dy * dt * 600 * app.settings.cameraSpeed);
    preview();
  };
}
