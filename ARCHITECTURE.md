# CitySim architecture

## Version 1.0

Office education gates are shared by growth and parcel diagnostics. Local offices
can develop from the start; larger offices require 25% / 45% education.
`buildingShape` shares geometry with selection hit targets and status badges.

Save schema 5 extends density to 1–3 and adds validated departmental funding.
Versions 1–4 migrate with funding at 100%. `ZONING_TOOLS` centralizes tier costs,
unlock requirements, and underlying zone/density choices. Density and building
development level remain independent. Occupied upzoning grants redevelopment
permission; evolution consumes spare utility capacity when it materializes.

Utility measurement reserves all power demand before enabling powered water
production. Facility rules declare output, input requirements, and emissions.
Funding scales service upkeep, capacity, and coverage strength; UI changes bump
the city revision to invalidate metrics. Government/zoning catalogs share these
rules with construction and inspection rather than maintaining separate prices.

### Retained version 0.6 foundation

`render/vehicles.js` maintains a bounded visual fleet derived from genuine routes.
It validates road continuity, uses map dimensions, interpolates right-hand lane
waypoints, and reserves separation/junction space in bounded frame substeps.
Vehicle state is presentation-only and not saved or fed back into aggregate traffic.
The renderer caches the ground, then depth-sorts vehicles together with buildings,
trees, and facilities. This replaces drawing vehicles over the completed scene.

`simulation/development.js` explains the same demand, utility, education, and
desirability conditions used by growth. Zoning brushes may partially apply to
eligible parcels, with exact change costs; other construction remains atomic.
City tools and guidance use native details/summary controls. Routine news stays
in the journal; notices are explicitly expanded. Save schema remains 4.

### Retained Phase 5 foundation

Version 0.5 retains save schema 4. Weighted routing now uses A* with Manhattan
distance divided by the network's maximum road speed as an admissible heuristic.
The dynamic rerouting bound and route cache remain unchanged. One-way roads permit
perpendicular intersection turns while rejecting reverse travel.

Save validation and scene rendering index entities by ID rather than repeatedly
scanning arrays. Construction validates finite in-map selections, applies bridge
multipliers to upgrades, and immediately bounds the timeline even while paused.
The local HTTP server serves only game entry/assets, checks resolved paths, and
supports GET/HEAD. It exports a server factory for isolated request tests.

See `docs/PHASE_5_REPORT.md` for browser checks, measured stress results, and
remaining release gates. A 25,000-resident dense fixture runs; the 50,000 fixture
does not fit. This is not a sustained-population or rendering guarantee.

### Retained Phase 4 foundation

Version 0.4 adds `simulation/life.js`, `render/atmosphere.js`, `ui/journal.js`, and
`ui/audio.js`. Atmosphere is derived from seed/calendar without consuming RNG;
news/events update on monthly boundaries and use bounded persistent collections.
The final atmospheric drawing pass preserves analytical overlay readability and
avoids baking night tint into the cached scene. Audio nodes are reused and muted
on visibility changes. Coordinate map actions share normal build validation.

Version 4 persists journal entries, earned distinctions, last report day, and
festival expiry. Older envelopes are validated before migration. Preferences
remain local to the device. See `docs/PHASE_4_REPORT.md` for the historical checkpoint.

### Retained Phase 3 foundation

Version 0.3 adds road-class metadata, directed weighted Dijkstra routing, and
strongly connected travel regions for employment. Physical components continue
to carry utilities regardless of driving direction. The busiest 32 sampled
commutes can reroute against current load; this calculation is deterministic.
Transit derives closed loops, reachable depot allocations, capacity, ridership,
fares, and reduced car volume. Freight derives directed supplier/trade access.
District policies alter local taxes, industrial emissions, and transit preference.
Dense zoning scales capacity and utilities; offices use education for productivity.

New modules: `transport/roads.js`, `transport/transit.js`, `transport/freight.js`,
`simulation/districts.js`, and `ui/mobility.js`. Version 3 saves retain road types,
stops, signals, density, routes, districts, and policies. Versions 1/2 are validated
before explicit migration. See `docs/PHASE_3_REPORT.md` for the current checkpoint.

### Retained Phase 2 foundation

The original foundation decisions below remain applicable. Version 0.2 adds
`environment.js` for derived land value, desirability, pollution, noise, health,
and crime fields; `services.js` for capacity-limited road coverage;
`evolution.js` for education, waste, upgrades, and decline; `incidents.js` for
seeded fires and dispatch; and `transport/traffic.js` for routed load and delay.

Measurement is read-only and cached by city day, revision, graph revision,
building count, and tax rates. Simulation mutations invalidate the cache.
Coverage searches begin at reachable perimeter roads on the facility's operational
component. Dispatch chooses the shortest entrance route. Provider assignment is
deterministic; overloaded providers reduce coverage rather than creating capacity.

Saved state now includes persistent ground contamination, building education,
waste, condition counters, damage, and incidents. Save version 2 validates these
fields. Version 1 envelopes are checksum/schema checked before explicit migration;
new historical indicators start with subsequent monthly reports. Runtime fields
and caches are rebuilt after loading. See `docs/PHASE_2_REPORT.md` for verification.

## Phase 1 decisions

CitySim is a dependency-free ES-module browser game. Node 22+ runs the local
development server and native simulation tests. This approach is appropriate for
the empty project and available runtime: no engine installation or external
art assets are needed. Desktop browsers with Canvas 2D, Web Audio, and localStorage
are the initial target. No publishing or deployment is part of this checkpoint.

### State and simulation

The authoritative city is a serializable object. A seeded PRNG generates a
56 × 56 terrain grid and all development choices. Cells represent parcels,
roads, or parts of a municipal facility. Buildings store aggregate residents
and jobs, not individual citizens. Fixed simulation days are independent of
render frames. Development runs every four days; accounting runs every thirty.
Statistics retain 240 monthly samples. Runtime graph caches never enter saves.

### Transport and utilities

Each road tile is a graph node with orthogonal edges. A dirty graph rebuilds
only after construction/demolition. Connected components establish network
access. BFS routes are cached by endpoints and invalidated with the graph.
Sampled commute flows use actual routes and contribute load to road cells;
the renderer animates a bounded sample of those routes. This is a Phase 1
foundation, not yet freight, lane, or intersection simulation.

Power and water plants serve their connected road component. Roads abstract
buried utility distribution. Component demand determines supply ratios,
so disconnected districts cannot borrow another district's utility capacity.
All buildings require direct road access. Each 2 × 2 facility also requires
a road on its perimeter. Bridges are explicit, higher-cost road tiles over
water. Rock ridges are unbuildable and require planning around them.

### Economy and development

Residential migration responds to available employment, taxes, access,
utilities, and the statistical employment rate. Commercial and industrial
buildings employ the workforce. Industry starts with external-market demand.
Commercial demand follows residents. Smoothed RCI values govern construction.
Empty zoned parcels with no road or utilities cannot develop. Construction
has a real duration and pauses when access/supply is removed. Existing housing
loses occupants gradually when conditions fail. Taxes generate monthly income;
roads and facilities generate recurring expenses. Budget pressure is real.

### Rendering and input

Canvas 2D draws original procedural isometric terrain, trees, roads, bridges,
construction sites, buildings, municipal utilities, and route-following cars.
Rendering reads state without mutating it. Screen/world transforms support
cursor-anchored zoom, smooth pan, view culling, and bounded camera travel.
An offscreen scene cache invalidates on camera, authoritative metrics, editing,
overlay, or preview changes. Environmental animation refreshes at 12.5 Hz;
vehicles and camera movement render each animation frame. Reduced motion
allows a fully static scene cache. Visible building silhouettes support picking.
HTML/CSS provides the accessible HUD, inspectors, toolbars, dialogs, settings,
save manager, and statistics. Reduced motion and UI scale are persisted.

### Persistence

Versioned JSON envelopes include a checksum, schema validation, city metadata,
and all authoritative state, including PRNG state and time. LocalStorage holds
three manual slots plus autosave. File export/import is the portable backup.
Failed saves or corrupt/unsupported files produce visible errors. Loading
rebuilds derived fields and transport caches. Save → load → save is tested.

### Performance and progression

Different frequencies, bounded traffic samples, route caching, camera culling,
and aggregate population keep work proportional to parcels rather than people.
This first map supports a town; the 50,000+ target is future profiling work.
Phase 3 adds directed roads, transit, trade, and districts; ambience is Phase 4.
The main menu uses a separate simulated showcase city; new cities start empty.

## Modules

- `src/simulation`: rules, deterministic terrain, city ticks, persistence
- `src/transport`: graph, network components, cached routes
- `src/render`: original Canvas city art and camera
- `src/ui`: application state, input, dialogs, HUD, charts
- `tests`: headless regression tests for authoritative systems
- `tools`: development server and reproducible benchmarks
- `docs`: permanent specification and recorded QA
