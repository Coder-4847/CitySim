# Phase 3 — The city moves

Completed checkpoint: version 0.3.0, 2026-10-02. Phase 4 has not started.

## IMPLEMENTED

- Local streets, four-lane avenues, four one-way directions, highways, bridge
  construction, upgrades, and intersection signals. Road classes have different
  costs, maintenance, speed, and capacity. Highways need frontage streets for
  building access; their intersections are at grade.
- Directed, speed-weighted road routing; strongly connected travel regions for
  return-trip employment access; junction conflict and congestion delays;
  congestion-aware reassignment of the busiest 32 sampled commute routes.
- Operational bus depots, roadside stops, named loop routes, editable fleets and
  fares, route pause/resume/removal, disruption reasons, finite capacity, actual
  commuter demand, fare revenue, and reduced car volume. Depots must be reachable
  in both directions. Routes allocate their available fleet once in list order.
- Freight from industry to shops, boundary-road trade gateways, exports/imports,
  shop goods shortages, and productivity consequences for industrial access.
- Town-stage offices and dense housing/shops. Density doubles capacity and
  utilities; office growth and productivity depend on education. Distinct artwork.
- Named, paintable districts and three policies: cleaner industry, free transit,
  and local tax relief. Policies affect emissions, revenue, migration, and demand.
- Transport catalog, route planner, district editor, bottleneck analysis, bus and
  freight layers, district colors, monthly transport/trade charts, updated budget
  and inspectors, directional arrows, bus stops, signals, depots, and vehicles.
- Version 3 saves with validated transport/district data and explicit migrations
  from versions 1 and 2. Runtime routes and caches rebuild on loading.

## TESTED

- `npm test`: **49 passed**, including 16 new transport regressions. Covers costs,
  atomic construction, directed access, signals, highway frontage, bus demand and
  capacity, fares, broken loops, unreachable depots, trade gateways, goods access,
  policies, office productivity, density utilities, invalid saves, migrations, and
  deterministic continuation with transport state.
- Browser: loaded a real version 2 QA city; created and painted a district;
  changed policy; built a depot and three stops; created two bus routes through
  actual map input; paused/resumed a line; saved/reloaded the new state.
- A working line carried **11 riders**, with **$43 projected monthly fares**.
  Upgrading the measured bottleneck to an avenue changed average commute delay
  from **41% to 15%** without advancing the clock.
- Inspected the desktop map, toolbar, route form, and analysis dialog. No browser
  console errors in the final reload. Screenshots: `screenshots/phase3-town.jpg`
  and `screenshots/phase3-analysis.jpg`. Browser QA does not cover every new tool
  at every viewport; high-density and office rules are covered headlessly.

## FIXED

- Return-trip access now governs employment instead of undirected connectivity.
- Depots cannot supply an isolated route; fleet allocation cannot double count buses.
- Transit needs distinct origin and destination stops within walking distance.
- Dense construction reserves its full utility demand and pending housing capacity.
- Vehicle animation follows forward route order on one-way streets.
- Updated migration geometry assertions to preserve original fields while allowing
  explicit new metadata, and restored the application entry point after an
  interrupted file write. Corrected toolbar markup during visual verification.

## PERFORMANCE

Node v24.19.0, 360-day runs, 702 streets and 92 facilities in each fixture:

| Initial residents | Buildings | Mean tick | First measurement | Save | Load | Ending residents |
|---:|---:|---:|---:|---:|---:|---:|
| 1,000 | 91 | 5.200 ms | 32.37 ms | 8.60 ms | 5.96 ms | 246 |
| 5,000 | 451 | 9.260 ms | 26.70 ms | 9.03 ms | 6.34 ms | 2,251 |
| 10,000 | 901 | 11.496 ms | 19.12 ms | 10.19 ms | 8.39 ms | 6,601 |

These are deliberately stressed utility-connected fixtures, not balanced cities,
fixed-population load tests, rendering benchmarks, or a maximum-route bus stress
test. Directed weighted routing costs more than the Phase 2 routing baseline.
The 25k–50k population target is not validated.

## KNOWN ISSUES

- Aggregate traffic and goods units, not individual lane or vehicle simulation.
  Commutes are sampled, route reassignment is bounded, and the first matching bus
  line gets a trip; there are no transfers or passenger itinerary optimization.
- Highways have at-grade intersections, not ramps, overpasses, or interchanges.
- Freight uses reachable suppliers, without warehouses, inventories, or full
  supply-chain accounting. Boundary roads stand in for neighboring markets.
- Depot fleet prioritization follows route order; districts can be cleared but
  do not yet have rename/delete controls. Each map supports 24 routes/districts.
- Existing coverage allocation and economy balance limits remain. Cross-browser,
  audio listening, full export/import download-loop QA, and maximum bus-network
  rendering stress still need later verification.

## ARCHITECTURE CHANGES

Road metadata feeds a directed weighted graph alongside physical utility
components. Strongly connected travel components keep employment consistent with
one-way access. `roads.js`, `transit.js`, `freight.js`, `districts.js`, and
`ui/mobility.js` separate rules, derived operations, and player controls. Saves
contain player choices and simulation state; route geometry and metrics remain
derived and are not serialized.

## NEXT PHASE

Stop here for player testing. Phase 4 adds day/night, weather, ambience, events,
news, neighborhood identity, richer presentation, accessibility, and audio polish.
