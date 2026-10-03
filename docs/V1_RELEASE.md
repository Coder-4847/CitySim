# CitySim 1.0

## Fixes and polish

- Local offices are available immediately. Population drives demand; medium and
  high-density offices require 25% / 45% education, explained in the zone picker
  and parcel inspection. Office has its own toolbar button and keyboard shortcut 0.
- Government & services is always labeled beside City tools. Parks, schools,
  hospitals, police, fire, waste, utilities, and funding have grouped catalogs
  with cost, capacity, unlocks, and operational counts.
- Rebuilt zone artwork: pitched-roof houses, apartments, storefronts with awnings,
  glass offices, and warehouses with loading bays. Windows follow wall planes.
  Building growth preserves density silhouettes. Night lights, construction cranes,
  roof badges, and selection areas follow building geometry.
- Three density tiers and three development levels for all four zone types.
  Expanded government facilities, four power options, and four water options.
- Road-following vehicles yield at crossings and maintain spacing. Zoning brushes
  skip roads and occupied parcels; inspection explains why empty land is waiting.
- Labeled construction dock, collapsible tools and notices, refreshed landing
  page, procedural weather and lighting, animated traffic and construction.
- Tested static packaging and automatic GitHub Pages deployment after tests pass.

## Validation

82 automated tests cover construction, growth, office requirements, all building
variants, utilities, services, funding, traffic spacing, transit, save migration,
corruption handling, deterministic continuation, and long-running simulation.
Browser checks cover saved-city loading, government and zone catalogs, visual
layout, and rendering. No third-party runtime dependencies.

## Scope and known limits

This is a desktop miniature city builder with aggregate populations and sampled
traffic, not individual citizen agents. The map is 56 × 56. Large-city balance
and rendering remain performance limits; simulation stress runs do not establish
frame-rate guarantees. Mobile and a full Chrome/Edge/Firefox matrix are unverified.
Audio listening QA and the complete browser download-to-import round trip remain
unverified. Local storage is tied to the browser and site address; keep JSON backups.
Save schema 5 remains compatible with the previous government update.
