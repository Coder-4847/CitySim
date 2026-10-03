# Version 0.6 — Neighborhood update

2026-10-02. Local checkpoint addressing zoning, visual traffic, and screen clutter.

## Fixed behavior

Zoning previously rejected a complete drag if even one parcel was a road,
building, facility, rock, or water. The brush now preserves those parcels and
charges only for eligible changes. Prepared land has a clear colored boundary;
trees are cleared on newly zoned parcels. Inspecting undeveloped zoning explains
missing road frontage, spare utilities, demand, education, or local desirability.
Ready parcels explicitly explain that time must run for construction to begin.

Visible vehicles previously used independent clocks, a constant screen offset,
and the default map width. They were drawn after buildings, making them appear
to pass through facades. The new bounded fleet uses continuous lane positions,
spacing checks, junction reservations, and depth ordering with world objects.
Invalid/demolished routes are removed; fully transit-served commutes do not spawn
cars. Pausing, opening a dialog, or reduced motion freezes vehicle movement.
Cars are samples of real route demand, not one vehicle per resident. They recycle
at trip endpoints; these visual rules do not replace aggregate simulation traffic.

## UI and art

- New landing composition and typography, stronger building colors, mixed round
  and conifer trees, brighter waterways, animated fountain droplets, and clearer cars.
- City tools expand on demand. Notices stay behind a count button; clicking one
  opens its location without stacking the notice list over the inspector.
- Guidance is one compact expandable step, disappears on completion, and closes
  when city tools are expanded. The construction hint appears only while building.
- Routine journal entries no longer generate toasts. Toasts are capped at two.
- Gentle landing, dialog, drawer, demand-bar, and button transitions respect reduced
  motion. World animation includes existing turbines, cranes, smoke, and weather.
- Inspector scroll position survives updates; unchanged notice buttons are retained.

## Verification

- 73 automated tests passed; 35 source/tool modules passed syntax checks.
- Six new regressions cover mixed-parcel zoning and exact costs, housing growth
  after supplying utilities, map-width/turn continuity, spacing/pause/demolition,
  rejection of zero-volume or invalid trips, and crossing-traffic progress.
- Fresh browser city: dragged Residential across a street. Result: 22 parcels
  zoned for $176, with 11 road tiles preserved. Added utilities and industrial
  employment; homes constructed and residents moved in. The test town later
  suffered expected service/pollution pressures while running unattended.
- Loaded an existing schema-4 city, selected the traffic layer, inspected optional
  notices, tested notice-to-inspector switching, and checked the 800 × 650 layout.
- Visually checked cars on roads, foreground occlusion, the landing page, and
  compact controls. A small-city debug snapshot reported 185 FPS / 1.10 ms per
  tick; this is an observation, not a controlled large-city performance guarantee.
- Final browser console error check was clean. Screenshots are in
  `docs/screenshots/neighborhood-landing.jpg` and `neighborhood-city.jpg`.

## Remaining limits

This pass fixes reproduced issues; it does not establish that every feature is
bug-free. Large-city browser profiling, cross-browser testing, audio listening,
full file export/import, and sustained economy balance remain as documented in
RELEASING.md. Very dense visual traffic can queue; the fleet is capped at 80
distinct route samples. No publication or save-format migration is required.
