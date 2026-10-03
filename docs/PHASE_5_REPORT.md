# Phase 5 — Release quality

Version 0.5.0, 2026-10-02. Local release candidate; not published. Save schema
remains 4. This is a stable checkpoint, with the manual gates below still open.

## IMPLEMENTED

- Profile-guided routing and entity lookup changes, defensive construction and
  save validation, restricted local file serving, and compact-layout polish.
- Repeatable 1,000 / 5,000 / 10,000 and dense 25,000 initial-resident benchmarks,
  with explicit unsupported reporting when the 50,000 fixture cannot fit.
- Release preparation instructions in [RELEASING.md](../RELEASING.md).

## TESTED

- `npm test`: 67 tests pass on Node 24.19, including independent reference-route
  cost comparisons, one-way turns, bridge costs, malformed saves, invalid build
  inputs, 110 paused construction events, and server request boundaries.
- Ten-year deterministic simulation with a midway save/reload produces identical
  continuation, finite accounts, and bounded history/news collections.
- In-app browser: loaded an older QA city, built two road parcels by coordinates
  for $90, checked resulting treasury and road count, selected all 27 map views,
  and exercised all four journal tabs and five statistics tabs, budget, and the
  nine-card service catalog. Overlay selection/runtime was audited; this does not
  establish numerical correctness of every visible heatmap.
- Ran the QA city at fast speed over approximately four simulation years;
  journal entries, distinctions, and funded events appeared. Saved and reloaded
  slot 2; 43 news entries persisted. Created a coast city on challenging difficulty
  and verified $25,000 initial treasury with no buildings or roads.
- Inspected night lighting, high contrast, and reduced motion. At 800 × 650,
  the final controls/field-guide gap is 18 pixels. Reset viewport and restored
  automatic lighting and original contrast/motion preferences afterward.
- No browser console errors in the final check. Screenshots:
  [night city](screenshots/phase5-night.jpg) and
  [city journal](screenshots/phase5-journal.jpg).
- The earlier preview problem was an unavailable local server and an error-page
  tab. Restarting the server and opening a normal HTTP tab restored access.

## FIXED

- One-way roads previously rejected perpendicular turns at intersections.
- Upgrading a bridge omitted the water cost multiplier. A street bridge plus a
  highway upgrade now costs the same $880 as a direct highway bridge.
- Invalid/prototype tool names and noninteger/out-of-map selections are rejected
  before changes; unbounded selections cannot enter construction loops.
- More than 100 facility placements while paused could make a save invalid until
  time advanced. Construction now trims history immediately.
- Null entries in malformed save collections now produce validation errors.
- Compact map controls no longer overlap the guide; dialogs have accessible names.
- Development server no longer exposes arbitrary project files and rejects
  traversal, unsupported methods, and paths outside the game assets.

## PERFORMANCE

CPU profiling identified route search, service coverage, environmental spreading,
and traffic as major costs. A* and indexed entity access target these operations.
No material overall tick-speed improvement is claimed: the same-session 10,000
baseline was 11.701 ms versus 11.929 ms in the final run, within run variability.

Final Node 24.19 runs, 360 simulation days; times are milliseconds:

| Initial residents | Active buildings initially | Mean tick | Save | Load | Heap delta MB | Ending residents |
| --- | --- | --- | --- | --- | --- | --- |
| 1,000 | 91 | 4.858 | 6.27 | 5.75 | 2.25 | 246 |
| 5,000 | 451 | 9.437 | 8.08 | 6.15 | 3.72 | 2,251 |
| 10,000 | 901 | 11.929 | 9.18 | 7.39 | 2.33 | 6,601 |
| 25,000 | 491 | 9.248 | 8.46 | 6.27 | 5.26 | 5,273 |

All fixtures have 702 road tiles. Standard fixtures have 92 facilities; the
dense fixture has 140 and fewer, higher-capacity buildings. First-tick times were
29.85 / 28.86 / 26.33 / 44.01 ms, and saves were 512.7 / 630.3 / 779.1 / 648.1 KB.
Heap deltas use explicit GC before/after and are neither peak-memory measurements
nor proof against leaks. These deliberately stressed cities lose population;
the numbers do not prove sustained large-city balance, browser FPS, or fixed
population throughput. The 50,000 layout exceeds map capacity and is unsupported.

## KNOWN ISSUES

- Full browser export-to-import round-trip, audio listening, browser compatibility
  matrix, and comprehensive keyboard/screen-reader audit remain manual gates.
- Rendering/FPS at large population and sustained 25,000–50,000 balance remain
  unverified. Player feedback is needed on economy and service tuning.
- Existing scope limits remain: aggregate travel/freight, at-grade highways,
  no bus transfers, strongest-provider coverage without load redistribution,
  presentation-only weather, and no district rename/delete controls.
- No redistribution license is selected. Project remains local and unpublished.

## ARCHITECTURE CHANGES

Weighted A* uses Manhattan distance / maximum network speed as its lower bound;
cached static routes and bounded load-aware rerouting retain deterministic behavior.
Save validation and scene construction use ID maps. The server exports a testable
factory while the command-line entry still binds to loopback. No dependencies or
new save schema were introduced.

## NEXT PHASE

Continue release validation and balance fixes after playtesting. Complete the
manual gates in RELEASING.md before claiming a public release; no Phase 6 feature
expansion or publication is implied by this checkpoint.
