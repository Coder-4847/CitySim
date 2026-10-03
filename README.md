# CitySim

An original isometric city builder about creating the conditions for a town to
grow. Version 1.0 includes four zone types with three density tiers, government
services and departmental funding, multiple power and water plants, transport,
city policies, and portable saves. Buildings have distinct isometric silhouettes,
with low-rise houses staying low-rise as they improve.

[Play CitySim](https://coder-4847.github.io/CitySim/) · [Release notes](docs/V1_RELEASE.md)

## Run locally

Requirements: Node.js 22 or newer (tested on 24.19) and a modern desktop browser. No dependencies
need to be installed.

```sh
npm start
```

Open **http://127.0.0.1:4173**. Keep the terminal running while playing. To use
another port, set the `PORT` environment variable. Saves belong to the browser
and address you use, so keep that address consistent.

```sh
npm test
npm run benchmark
npm run benchmark:large
```

The test runner uses one process to work in restricted development environments.
The benchmark constructs 1,000 / 5,000 / 10,000-resident stress fixtures with
60 civic facilities and 32 utility facilities. It measures simulation, routing,
saving, and loading; these deliberately stressed layouts are not balanced cities
or rendering benchmarks. The large run adds a denser 25,000-resident fixture;
the 50,000-resident fixture exceeds this map's capacity. Population changes during
each run, so timings are not fixed-population or frame-rate guarantees.

## Your first town

1. Choose **New city**, name it, select a seed and landscape, and found it.
2. Drag a road about 15 tiles long. All construction shows its cost before placement.
3. Place a wind station and water tower beside that road. Each occupies 2 × 2 tiles.
4. Click Residential and choose a density tier (3 selects low density directly),
   then drag across empty land beside roads. Zoning skips
   roads, occupied parcels, and unsuitable terrain; you pay only for changed parcels.
   Add industry beside roads, leaving a buffer between factories
   and homes. Every developing parcel needs a directly adjacent road. Roads
   distribute utilities within their network.
5. Run time and wait for construction. Add commercial zoning when blue demand rises.
   Office is available on the main toolbar: small offices need population demand;
   medium and high-density offices require 25% and 45% city education.
6. Click the treasury for taxes and accounts. Expand **City tools** for map layers and inspect
   buildings to diagnose actual access, supply, occupancy, or workforce problems.
7. Open **Government & services** for parks and waste collection. At 100 residents, add schools,
   healthcare, police, and fire protection. Short connected streets improve coverage.
8. Use Government → Funding to adjust departmental budgets. Click Power or Water
   for larger utility options as your population grows.
9. Use **Save city** to save to one of three slots. Autosave uses a separate slot.
   Export JSON backups before clearing browser data. Import restores those files.

Zoning reserves land; it does not place a finished house. Inspect an empty zoned
parcel to see missing roads, utility capacity, demand, or local conditions. Press
Play when it is ready. Visible cars need actual journeys between occupied homes
and workplaces; an empty road does not generate traffic by itself.

Roads across water become bridges and cost more. Rocky ridges prevent development.
Roads may replace empty zoning; occupied buildings need demolition first.
Demolishing any tile of a utility removes its complete footprint. No demolition
refunds are provided. Empty zoning can be removed free with **Dezone**.

## Controls

| Action | Control |
| --- | --- |
| Pan | WASD or arrow keys; right/middle drag; Alt + drag |
| Zoom toward pointer | Mouse wheel |
| Center map | Home, or the home camera button |
| Inspect / road / R / C / I / power / water / demolition / dezone | 1 through 9 |
| Build | Select tool, then click or drag on the map |
| Pause / resume | Space |
| Speed | HUD buttons: pause, 1×, 3×, 8× |
| Return to inspection / dismiss inspector | Escape |
| Statistics | G |
| Save manager | Ctrl+S |
| Debug grid and performance / graph counters | F3 |

Dialogs pause the simulation. Menu and preferences provide UI scaling, reduced
motion, camera speed, optional edge scrolling, autosave interval, contextual
guidance, and synthesized interface/construction sound volume. The browser's
window controls display resolution and closing the game.

## What's in this checkpoint

- Seeded river, coast, and plains maps with forests and rocky ridges
- Smooth isometric camera, placement previews, roads, bridges, intersections,
  demolition, and zoned development
- Three economic building types with eight procedural variants each and timed
  construction stages
- Aggregate residents, workforce, employment, smoothed RCI demand, tax rates,
  monthly income and maintenance, treasury, and financial alerts
- Component-based power and water production, demand, and shortages
- Actual road graph, cached commute routes, bounded visible cars, traffic load
- Zoning, traffic, occupancy, electricity, and water overlays with legends
- Inspectors, building renaming, tutorial, menu, settings, statistics, timeline
- Schools, university, healthcare, police, fire protection, garbage, and parks
- Land value, desirability, education, health, crime, pollution, noise, and waste
- Building levels 1–3, abandonment and recovery, fires and municipal vehicles
- Congestion consequences, service capacity, seven progression stages and unlocks
- Eighteen additional data layers and tabbed civic/quality/economy statistics
- Versioned checked saves, autosave, three slots, and JSON import/export
- Automatic migration of valid Phase 1, Phase 2, and Phase 3 saves; new civic history begins after loading

Read [ARCHITECTURE.md](ARCHITECTURE.md) for module boundaries and design decisions,
[docs/GOVERNMENT_UPDATE.md](docs/GOVERNMENT_UPDATE.md) for current features and verification,
[docs/PHASE_5_REPORT.md](docs/PHASE_5_REPORT.md) for stress results and limitations,
and [docs/MASTER_SPECIFICATION.md](docs/MASTER_SPECIFICATION.md) for the permanent target.

## Transport and districts

Open **Transport** under Map Layers. Roads & zoning contains avenues, one-way
streets, signals, highways, offices, and dense zones. Town unlocks highways and
advanced zoning at 500 residents. Roads on the map boundary connect external trade.

For buses, open **Bus routes**, build a depot (Village unlock), and place street
stops. Choose **Select route stops**, click them in order on the map, then reopen
Transport to name the loop and choose buses/fare. The final stop must have a legal
return route to the first. Each operational, reachable depot supports 12 buses.
Watch rider demand and operating costs; a route without demand still costs money.

Under **Districts**, create a district, paint its parcels, then set policies.
Use **Transport analysis**, the bus/freight/district layers, and the
**Statistics → Transport & trade** charts to compare the results.

## City life and accessibility

Open **City journal** for news, neighborhoods, history, and distinctions. News
begins with the next monthly report after loading an older save. Neighborhood
open days can cost $150 every 180 days when a healthy town has an active park
and sufficient funds; they add 10 housing-demand target points for 14 days.

**Map actions** (P) lets you inspect or build with parcel coordinates and a
keyboard. It uses the same construction costs, unlocks, and validation as the map.
Choose a district in the form when painting. Set start and end coordinates equal
for a single parcel; facilities use the end coordinate for their 2 × 2 footprint.

**Settings** offers automatic/day/night lighting, weather effects, reduced motion,
high contrast, and ambient volume. Ambient sound defaults off and starts after
an interaction. It fades out when paused, in dialogs, or when the tab is hidden.
Presentation time runs separately from the calendar: one visual cycle spans 120
simulation days. Data overlays remain readable without nighttime tint.

## Current limits

The simulation uses aggregate populations, sampled commute routes, and aggregate freight.
Highways intersect at grade. Bus lines have finite capacity and fares, but no
transfers; the first matching line receives demand. Weather and lighting are presentation effects; they do not change utility demand. Districts can be painted/cleared but not yet renamed/deleted.
Coverage selects the strongest reachable provider before applying capacity;
overlapping providers do not dynamically rebalance their loads. The current map
completed a declining 25,000-resident simulation stress run; sustained large-city
balance, browser rendering at that scale, and 50,000 residents remain unvalidated.
Small-city economy balance still needs player feedback.

Local saves require browser storage. File import and local save/load were tested
in the Codex in-app browser; its automation did not expose the JSON download
event, so the complete export-to-import round-trip still needs a normal desktop
browser check. There is no browser matrix or audio listening QA yet.

## Assets and license

All artwork and sound are original procedural code; see
[ASSET_CREDITS.md](ASSET_CREDITS.md). No third-party runtime packages are used.
No redistribution license is granted in this repository.
