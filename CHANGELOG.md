# Changelog

## 1.0.0 — 2026-10-03

- Fixed early office development and explained education requirements for larger offices.
- Added a permanent Government & services entry and an Office toolbar tool.
- Rebuilt zone silhouettes, facade geometry, nighttime windows, and construction animation.
- Matched selection and warning positions to actual building heights.
- Added office growth and rendering regression tests (82 tests total).
- Added dependency-free static packaging and tested GitHub Pages workflow.

## 0.7.0 — 2026-10-03

Government & growth.

- Added a categorized Government catalog: parks/civic, education, healthcare,
  police/fire, waste, power, water, and departmental funding.
- Added city parks, city hall, police/fire headquarters, and recycling centers.
- Added coal, gas, and solar power; pumping stations, treatment works, and reservoirs.
  Emissions affect neighborhoods; powered water production stops during blackouts.
- Added three density tiers to residential, commercial, industrial, and office
  zoning, with rising costs/capacity, milestone unlocks, and occupied-lot redevelopment.
  Each density tier retains development levels 1–3.
- Departmental funding from 50–150% changes operating expenses, coverage strength,
  and capacity. Catalogs show owned/operational counts and infrastructure balances.
- Added original facility art. Save schema 5 migrates versions 1–4 automatically.
- 79 automated tests pass, including new rules, blackout dependencies, redevelopment,
  funding persistence, and legacy migration. See `docs/GOVERNMENT_UPDATE.md`.

## 0.6.0 — 2026-10-02

The neighborhood update.

- Zoning brushes skip occupied/unsuitable parcels, charge only for changes, and
  visibly prepare land. Inspectors explain why empty zoning is waiting to develop.
- Traffic uses continuous directional lanes, shared spacing and junction reservations,
  correct map dimensions, and depth ordering with buildings. Pause/reduced motion
  freezes visible cars; demolished routes and fully transit-served commutes spawn none.
- Refreshed landing page, warmer buildings, varied trees, water/fountain motion,
  and animated panels with reduced-motion support.
- Collapsed city tools, optional notices, compact guidance, and a smaller dock
  leave more of the map visible. Routine journal reports no longer interrupt play.
- Fixed stale placement feedback, notice/inspector overlap, shifting alert buttons,
  and inspector scrolling during simulation updates.
- 73 tests pass; fresh-city mouse zoning and development, old saves, and compact
  layout verified in the browser. See `docs/NEIGHBORHOOD_UPDATE.md`.

## 0.5.0 — 2026-10-02

Phase 5 — Local release candidate; manual release gates remain.

- Fixed one-way intersection turns, underpriced bridge upgrades, invalid build
  selections, and saves after more than 100 paused construction events.
- Added A* routing, indexed entity lookups, clearer malformed-save errors, named
  dialogs, and compact controls that no longer overlap the field guide.
- Restricted the local server to game files and added HTTP boundary tests.
- Added dense-city stress fixtures and ten-year save/reload determinism checks.
- 67 automated tests pass. Browser checks cover all 27 map views, journal,
  statistics, coordinate construction, local saves, and new-city creation.
- 25,000 initial residents complete the stress run; the 50,000 fixture cannot fit.
- Evidence and remaining audio/export/browser-matrix gates: `docs/PHASE_5_REPORT.md`.


## 0.4.0 — 2026-10-02

Phase 4 — The city lives (implementation; browser QA outstanding).

- Added deterministic day/night and weather presentation, powered windows,
  street lighting, rain/clouds, seasonal labels, and lighting preferences.
- Added city news, district identities, historical journal, distinctions,
  and funded neighborhood events with temporary housing-demand effects.
- Added keyboard coordinate map actions, high contrast, reduced-motion handling,
  construction animation, richer inspectors, and updated guidance.
- Added opt-in synthesized ambience with pause/dialog/hidden-tab fading.
- Added version 4 saves and migrations from versions 1–3.
- 59 automated tests pass; 36 modules pass syntax/import checks. Browser preview
  verification was blocked by tool security policy; visual/audio QA is pending.
- Full evidence and performance: `docs/PHASE_4_REPORT.md`.

## 0.3.0 — 2026-10-02

Phase 3 — The city moves.

- Added avenues, one-way roads, highways, signals, weighted directed routing,
  congestion rerouting, and return-trip employment access.
- Added reachable bus depots, stops, loop routes, finite fleets and capacity,
  ridership, fares, operating expenses, and disrupted-route handling.
- Added freight, boundary trade gateways, goods shortages, dense housing/shops,
  education-dependent offices, districts, and three effective local policies.
- Added transport tools, route planning, district controls, bottleneck analysis,
  map layers, transport/trade charts, and original road/transit/building artwork.
- Added version 3 persistence with migrations from versions 1 and 2.
- 49 regression tests pass. Browser bus route carried 11 riders; an avenue upgrade
  reduced measured commute delay from 41% to 15%.
- Recorded benchmarks, QA evidence, and limits in `docs/PHASE_3_REPORT.md`.

## 0.2.0 — 2026-10-01

Phase 2 — The city works.

- Added public services, capacity and street-based coverage, education, health,
  crime, garbage, parks, pollution, persistent contamination, and noise.
- Added land value, differentiated desirability, three building levels,
  abandonment/recovery, seeded fires, and routed municipal vehicles.
- Connected congestion to productivity, demand, collection, and emergency arrival.
- Added service catalog, progression unlocks, 18 data layers, richer inspectors,
  budget maintenance breakdown, and tabbed monthly statistics.
- Added validated version 2 saves with backward migration from version 1.
- Added 17 civic regression tests; 33 tests pass overall.
- Fixed disconnected coverage, facility-entry routing, stale emergency references,
  single-node vehicle animation, and overlapping alerts/camera controls.
- Expanded and repaired the 1k/5k/10k population benchmark to include civic facilities.
- Recorded browser QA, performance, and limits in `docs/PHASE_2_REPORT.md`.

## 0.1.0 — 2026-10-01

First playable Phase 1 checkpoint.

- Established separate authoritative simulation, transport graph, procedural
  renderer, input, and HTML interface modules.
- Added deterministic maps, roads/bridges, RCI zoning and construction,
  population/employment, taxation/accounts, power/water, and demolition.
- Added camera controls, HUD, inspectors, rename support, map layers, monthly
  statistics, notifications, tutorial, timeline, menu, and persisted preferences.
- Added versioned validated saves, three manual slots, autosave, import/export.
- Added 16 simulation regression tests and reproducible population benchmarks.
- Fixed multi-tile facility demolition leaving stale producers and invalid saves.
- Fixed building silhouette selection, stale budget projections, toolbar/inspector
  overlap at smaller desktop resolutions, and obscured debug counters.
- Recorded original asset sources, architecture, QA evidence, and limitations.
- Added a scene cache after profiling stationary terrain redraw, with separate
  per-frame vehicle motion. Fixed utility-layer coverage across full facilities.
