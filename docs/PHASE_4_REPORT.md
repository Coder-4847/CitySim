# Phase 4 — The city lives

Historical checkpoint: Phase 5 subsequently restored the local preview server and
verified browser interaction and visuals. See [PHASE_5_REPORT.md](PHASE_5_REPORT.md).
Audio listening and the full browser export/import round-trip remain outstanding.

Implementation checkpoint: version 0.4.0, 2026-10-02.
Automated verification passed. Browser visual/interaction QA is blocked and remains
outstanding; this is not a fully visually verified checkpoint. Phase 5 has not started.

## IMPLEMENTED

- Deterministic presentation day/night cycle, clear/overcast/rain conditions, and
  seasonal labels. A full presentation day spans 120 simulation days. These visuals
  do not alter the calendar, random sequence, utility supply, or weather-related
  economic conditions. Always-day and always-night preferences are available.
- Night tint, powered building windows, decorative street lighting, moving cloud
  haze and rain. Analytical overlays remain untinted. Reduced motion freezes the
  existing environmental art and suppresses moving rain/clouds and vehicles.
- City journal with monthly simulation-derived news, location links, historical
  timeline, earned distinctions, and district identities based on actual development.
  Reports cover infrastructure, congestion, transit, trade, abandoned properties,
  operating deficits, and stable growth. Repeated subjects have a 90-day cooldown.
- Neighborhood open days: every 180 days, an active park, 100 residents, at least
  65% health, and $5,000 treasury allow a $150 event. Housing demand target gains
  10 points for 14 days. The charge appears in treasury/history and the journal;
  it is a one-off event charge rather than monthly operating maintenance.
- Four persistent distinctions for population, transit, exports, and health.
  They award recognition, not money. News notifications appear on new reports.
- Keyboard-accessible Map actions dialog (P): choose a tool, coordinates, area,
  and district; preview cost and apply through the same construction rules as the
  canvas. Also supports inspection and adding stops to a route draft.
- High-contrast interface option; reduced-motion CSS; compact map navigation;
  additional tutorial guidance and inspector parcel, utility, tax, and work-access
  information. Space retains normal activation on focused buttons.
- Construction crane-hook animation and progress strips. Subtle dialog animation
  respects reduced motion. Quiet original synthesized ambience changes register
  at night, defaults off, starts after interaction, and fades when paused or hidden.
- Version 4 saves retain journal state, event expiry, and earned distinctions.
  Versions 1, 2, and 3 migrate explicitly; older historical stories are not invented.

## TESTED

- `npm test`: **59 passed**, including 10 new Phase 4 tests.
- Deterministic/read-only atmosphere; fixed lighting; event eligibility and expiry;
  duplicate-report protection; real event cost; bounded/rate-limited news;
  district identities; version 3 migration; invalid journal data rejection; and
  deterministic continuation after saving/loading.
- Unit-level drawing checks confirm analytical overlays remain unaffected and
  reduced motion suppresses rain strokes. Mock Web Audio checks verify explicit
  unlock, node reuse, stable scheduling, and silence when paused.
- All **36 JavaScript modules** parsed successfully and relative imports resolved.
- Browser verification was attempted, but the browser tool rejected access to the
  local preview under its security policy. No alternative browser or automation
  route was used to bypass that restriction. No Phase 4 screenshot is claimed.

## FIXED

- Event spending is included before recording the month's treasury history.
- Audio listeners are registered once rather than during rendering; recurring
  frames do not repeatedly schedule unchanged audio targets.
- Hidden-tab audio is muted from the visibility event, without relying on a
  requestAnimationFrame callback that the browser may suspend.
- Existing save migration expectations now reflect version 4. Core regression
  coverage for utilities, growth, transport, districts, and services still passes.

## PERFORMANCE

Node v24.19.0, 360 simulation days, 702 roads and 92 facilities per stress fixture:

| Initial population | Mean tick | First measurement | Save | Load | Ending population |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 7.316 ms | 43.38 ms | 8.01 ms | 7.45 ms | 246 |
| 5,000 | 16.614 ms | 38.49 ms | 12.11 ms | 10.19 ms | 2,251 |
| 10,000 | 21.153 ms | 33.79 ms | 12.16 ms | 13.07 ms | 6,601 |

These are stressed, declining cities rather than fixed-population tests. Timings
are higher than the previous recorded run; the cause is not profiled. These tests
do not measure rendering, audio quality, or the 25k–50k target. Release work should
profile representative scenes and fast simulation speeds before making FPS claims.

## KNOWN ISSUES

- New browser interaction flows, responsive layouts, visual quality, actual audio
  playback, and assistive-technology behavior still need manual browser verification.
  High contrast and keyboard controls do not constitute a full accessibility audit.
- Weather is visual; there are no floods, temperature-dependent demand, or weather
  disasters. Open days are the first civic event, not a broad event catalog.
- Ambience is a small synthesized harmonic bed, not recorded environmental audio.
  Street lights are decorative; building window lights use actual operational state.
- Existing Phase 3 limits remain: sampled traffic, no bus transfers, at-grade
  highways, simplified freight, and unvalidated large-city/rendering performance.

## ARCHITECTURE CHANGES

`simulation/life.js` derives atmosphere without consuming the simulation RNG and
updates bounded monthly journal/event state. `render/atmosphere.js` draws a final
presentation pass after the cached scene and vehicles. `ui/journal.js` hosts the
journal and coordinate map controls. `ui/audio.js` owns reusable Web Audio nodes.
Preferences stay device-local; city history and event state live in version 4 saves.

## NEXT PHASE

First finish player/browser QA: refresh the local game, load a city, open City
journal and Map actions, switch lighting and reduced motion in Settings, and test
ambient sound. Let a monthly report pass, then save and reload.

Phase 5 is release quality: fix reported issues, profile rendering/fast simulation,
audit accessibility, expand browser/save round-trip checks, and tune balance.
