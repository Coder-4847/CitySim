# Government & growth — v0.7

Completed checkpoint, 2026-10-03. Local and unpublished.

## How to use it

Click **Government** in the construction dock. Eight tabs expose parks/civic
buildings, education, healthcare, safety, waste, power, water, and funding.
Click **Power** or **Water** in the dock to go directly to their catalogs.
Number shortcuts 6/7 still select the inexpensive starter utilities directly.

Click a zone button to choose its density tier. Residential, commercial,
industrial, and office each have three choices:

| Tier | Capacity multiplier | R/C/I zoning cost | Office zoning cost | Unlock |
| --- | --- | --- | --- | --- |
| 1: low | 1× | $8 | $14 | Settlement; offices at Town |
| 2: medium | 2× | $16 | $28 | Town, 500 residents |
| 3: high | 3× | $40 | $70 | Regional center, 2,000 residents |

These are density permissions, separate from development levels 1–3. For example,
high-density residential capacity is 54 / 90 / 144 at development levels 1 / 2 / 3.
Higher tiers use proportionally more power and water. Existing level progression
still requires prosperous conditions, demand, health, education, and services.
Rezoning an occupied parcel upward preserves the building and occupants, allowing
redevelopment after 60 prosperous days and sufficient spare utility capacity.
Downgrading or changing the type of an occupied parcel requires demolition.

## New facilities and tradeoffs

| Power | Construction | Monthly upkeep | Output | Local emissions |
| --- | --- | --- | --- | --- |
| Wind | $2,400 | $95 | 450 | 0 |
| Coal | $8,000 | $390 | 2,400 | 65 |
| Gas | $18,000 | $650 | 4,800 | 24 |
| Solar with storage | $24,000 | $240 | 3,200 | 0 |

| Water | Construction | Monthly upkeep | Output | Power requirement |
| --- | --- | --- | --- | --- |
| Tower | $1,800 | $65 | 450 | 0 |
| Pumping station | $5,200 | $165 | 1,800 | 35 |
| Treatment works | $15,000 | $410 | 5,400 | 100 |
| Reservoir complex | $32,000 | $620 | 9,000 | 0 |

Powered water plants stop producing when their connected grid cannot meet power
demand within the existing 95% service threshold. Gravity-fed reservoirs and
towers continue supplying water. Solar includes storage and has steady output;
these are aggregate utility models, not detailed hydrology or electricity dispatch.
All facilities retain the existing 2 × 2 footprint and road-network distribution.

The civic expansion adds a city park, city hall/public square, police headquarters,
central fire headquarters, and recycling center alongside existing schools,
university, clinic, hospital, police/fire stations, park, and waste depot.
City hall currently supplies public-space benefits rather than a separate political
simulation. Recycling produces substantially less pollution than a waste depot.

## Government funding

Eight departments have separate budgets from 50% to 150% in 25% increments.
Funding multiplies monthly upkeep and capacity and changes coverage strength
(bounded at full coverage). Underfunding can therefore hurt both reach quality and
overload performance. Utility output and transit fleet rules are separate.
Connected roads, sufficient utilities, and travel delays still matter at any budget.

## Verification and resume point

- Full regression suite: **79 passed**. All 35 source/tool modules pass syntax checks.
- New tests cover all 12 zone choices, exact costs/unlocks, occupied redevelopment,
  power-dependent water, emissions, funding/capacity/accounting, all 11 new facility
  types, malformed funding, and schema-4 migration.
- Browser: loaded the existing schema-4 QA town; inspected all eight catalog tabs;
  placed an operational coal station for $8,000 with 2,400 output and $390 upkeep;
  changed police funding to 150% and observed $135 upkeep; inspected all zone choices.
- Existing saves migrate to schema 5, adding fully funded departments. Old versions
  of the game cannot load new schema-5 saves. No manual save slots were overwritten
  during the browser check. Final console check was clean.

Implementation is complete for this checkpoint. Remaining release gates from
RELEASING.md still apply, especially long-term economic balancing, large-city
browser performance, browser compatibility, audio, and a full file export/import
round-trip. Further depth can build on this checkpoint without restarting.
