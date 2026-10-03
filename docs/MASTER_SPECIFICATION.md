# CITYSIM
## MASTER DEVELOPMENT SPECIFICATION

You are the lead developer, systems designer, simulation architect, UI/UX designer, technical artist, performance engineer, and QA engineer responsible for building **CitySim**.

CitySim is an original, polished city-building and management game inspired primarily by the **design philosophy and systemic depth of classic city builders such as SimCity 4**, with selected usability lessons from modern city builders.

This is NOT intended to become an unnecessarily microscopic simulation of every human being.

It is also NOT intended to be a shallow building sandbox.

CitySim should occupy the middle ground:

**deep enough that city planning decisions produce meaningful systemic consequences, but abstract enough that the player spends their time being a mayor and urban planner rather than managing individual people.**

The desired feeling is:

> Build. Observe. Diagnose. Plan. Improve. Expand.

The city itself is the puzzle.

---

# 1. THE VISION

The player begins with:

- undeveloped terrain
- a limited municipal budget
- basic roads
- basic utilities
- basic zoning

From there, the player gradually develops:

- neighborhoods
- commercial centers
- industrial areas
- downtown districts
- infrastructure networks
- schools
- hospitals
- police and fire coverage
- parks
- public transportation
- highways
- utilities
- specialized districts

Eventually, the empty map should become a dense, visually active metropolis.

The player's role is not to manually construct every building.

The player creates CONDITIONS.

The simulation responds.

The player builds a road.

The player zones residential land.

People move in because there are jobs and adequate services.

Businesses appear because there are customers.

Industry expands because there is workforce, infrastructure, and demand.

Traffic emerges because people and goods must move.

Land value changes.

Buildings upgrade.

New problems appear.

The player responds.

That feedback loop is the heart of CitySim.

---

# 2. INSPIRATION WITHOUT COPYING

CitySim may take inspiration from the DESIGN PRINCIPLES of games such as SimCity 4 and Cities: Skylines.

Do NOT copy:

- proprietary code
- copyrighted artwork
- building designs
- UI layouts exactly
- logos
- music
- sound effects
- text
- maps
- names
- icons
- other protected assets

CitySim must have its own identity.

Take inspiration from concepts such as:

- zoning
- organic development
- city budgets
- transportation planning
- RCI demand
- land value
- service coverage
- utilities
- traffic
- education
- pollution
- desirability
- building development
- city statistics
- data overlays
- public transportation
- long-term city growth

---

# 3. DESIGN PHILOSOPHY

CitySim should lean toward simulation, but it should use **strategic abstraction**.

Do NOT simulate something microscopically merely because it is technically possible.

Ask:

**Does this create interesting decisions for the player?**

If yes, simulate it.

If not, approximate it intelligently.

For example:

Traffic should genuinely use the road network.

But we do not necessarily need to simulate every citizen as a permanent autonomous person.

Education should influence workforce quality.

But we do not need to track every student's homework.

Freight should influence industry and commercial activity.

But we do not need to model every individual box inside a truck.

The simulation should feel deep because its SYSTEMS interact, not because it contains meaningless variables.

---

# 4. PRIMARY GAMEPLAY LOOP

The central loop is:

### BUILD

Construct:

- roads
- infrastructure
- utilities
- services
- transportation

### ZONE

Designate:

- residential
- commercial
- industrial
- later high-density and office zones

### GROW

Buildings develop automatically according to demand and local conditions.

### OBSERVE

Watch:

- traffic
- construction
- population
- businesses
- services
- vehicles
- neighborhood growth

### DIAGNOSE

Use:

- overlays
- statistics
- graphs
- inspectors
- alerts

### SOLVE

Address:

- congestion
- unemployment
- worker shortages
- pollution
- crime
- service shortages
- utility shortages
- financial problems
- declining neighborhoods

### EXPAND

Unlock additional infrastructure and grow into a larger city.

This loop should remain satisfying for many hours.

---

# 5. VISUAL IDENTITY

CitySim should use an attractive:

**semi-pixel-art / modern retro city-builder aesthetic.**

It should evoke the clarity and charm of classic city-building games without looking primitive.

Imagine:

pixel-art influence

+

modern rendering

+

smooth animation

+

excellent UI

+

atmospheric effects.

Do NOT simply render the game at an extremely low resolution.

Pixelation should be stylistic.

Potential characteristics:

- crisp building silhouettes
- detailed miniature architecture
- slightly exaggerated building proportions
- readable roads
- tiny vehicles
- construction animations
- animated trees
- smoke
- industrial steam
- water movement
- streetlights
- vehicle headlights
- emergency lights
- building illumination
- subtle shadows
- weather
- nighttime lighting

Zoomed out:

the city should resemble a beautiful living miniature.

Zoomed in:

there should constantly be small things happening.

---

# 6. CAMERA

The camera is one of the most frequently used systems and must feel excellent.

Implement:

- smooth pan
- smooth zoom
- keyboard movement
- mouse movement
- optional edge scrolling
- zoom toward cursor if technically appropriate
- sensible map boundaries
- adjustable camera speed

If the rendering approach supports rotation cleanly, include it.

Otherwise prioritize visual clarity over unnecessary camera complexity.

Camera movement should feel polished from the beginning.

---

# 7. WORLD

Create procedurally generated or seed-based maps.

Possible terrain:

- plains
- forests
- hills
- rivers
- lakes
- coastlines
- fertile land
- resource deposits

Terrain should influence planning.

A river should matter.

A mountain should matter.

A coastline should matter.

Do not generate terrain that merely looks different while playing identically.

New Game should allow:

- city name
- map selection or generation
- seed
- starting budget/difficulty
- potentially terrain characteristics

World generation should be deterministic from the same seed where practical.

---

# 8. ROADS

Road construction must be one of CitySim's strongest mechanics.

Implement progressively:

- basic two-lane road
- avenue
- larger arterial
- one-way road
- highway
- highway ramp
- bridge
- potentially pedestrian-oriented streets

Roads should support:

- straight construction
- intersections
- T-junctions
- sensible snapping
- upgrading
- demolition
- cost preview
- placement preview
- valid/invalid feedback

Curves should be supported if technically practical without destabilizing the architecture.

Roads influence:

- accessibility
- development
- traffic
- noise
- land value
- service access
- travel time

Building roads should feel satisfying.

---

# 9. TRANSPORT NETWORK MODEL

Create a proper transportation graph.

Nodes represent intersections or meaningful connection points.

Edges represent road segments.

Edges can contain information such as:

- length
- road type
- speed
- capacity
- congestion
- direction

Use efficient pathfinding.

Possible algorithms:

- A*
- hierarchical pathfinding
- cached routes
- region-based pathfinding

Choose appropriately.

Do not recalculate thousands of identical routes unnecessarily.

---

# 10. TRAFFIC

Traffic should be SIMULATED enough to matter.

Vehicles should travel between meaningful origins and destinations.

Trip categories can include:

- commuting
- shopping
- freight
- service calls
- school travel
- public transportation

Traffic should respond to:

- road capacity
- road speed
- intersections
- congestion
- route availability

Congestion should create consequences.

Possible effects:

- slower commutes
- reduced commercial accessibility
- delayed freight
- delayed services
- reduced desirability

However:

Do NOT turn CitySim into an unnecessarily microscopic traffic simulator.

Use aggregation, route caching, and statistical approximation when appropriate.

The player should primarily care about:

**Does my transportation network work?**

---

# 11. INTERSECTIONS

Intersections should create meaningful traffic behavior.

Support reasonable:

- yielding
- intersection priority
- traffic lights where appropriate
- turning behavior

Avoid expensive microscopic lane simulation unless it meaningfully improves gameplay.

Major intersections should be visible sources of congestion.

The traffic overlay should make this obvious.

---

# 12. ZONING

Core zones:

### RESIDENTIAL

Housing and population.

### COMMERCIAL

Shops and services.

### INDUSTRIAL

Manufacturing and employment.

Later:

### HIGH-DENSITY RESIDENTIAL

### HIGH-DENSITY COMMERCIAL

### OFFICE

Potential specialized industry later.

Zoning should be intuitive.

Support:

- painting
- dragging
- removal
- zone visualization

Zones generally require road access.

Buildings develop automatically.

---

# 13. BUILDING DEVELOPMENT

Buildings should progress organically.

Example:

EMPTY ZONE

↓

CONSTRUCTION

↓

LEVEL 1

↓

LEVEL 2

↓

LEVEL 3

Development depends on factors such as:

- demand
- land value
- services
- education
- taxes
- pollution
- accessibility
- utility availability
- employment conditions

Buildings can also decline.

Potential states:

- prosperous
- stable
- struggling
- abandoned

Abandonment should have understandable causes.

---

# 14. BUILDING VARIETY

Avoid obvious repetition.

Create multiple visual variants for each:

- zone
- density
- development level

Residential areas should visibly change from:

small houses

to apartments

to dense urban buildings.

Commercial areas should evolve from:

small shops

to larger businesses

to downtown towers.

Industrial development should similarly evolve.

Procedural variation can include:

- roof details
- windows
- signs
- vegetation
- rooftop equipment
- façade differences

Do not sacrifice visual coherence merely to maximize randomness.

---

# 15. RCI DEMAND

Implement Residential / Commercial / Industrial demand.

Demand should emerge from the simulation.

Residential demand considers:

- employment
- available housing
- taxes
- city desirability

Commercial demand considers:

- population
- purchasing power
- accessibility
- taxation

Industrial demand considers:

- workforce
- commercial activity
- external trade
- taxes

RCI should respond gradually.

Avoid chaotic oscillation.

Display demand clearly.

---

# 16. POPULATION MODEL

Use a hybrid/statistical population model rather than unnecessarily storing every citizen permanently.

Track meaningful population categories such as:

- total population
- households
- age distribution
- education
- employment
- wealth/income groups
- workforce

Individual visible pedestrians may be generated from underlying population data.

They do not necessarily need permanent life histories.

Buildings can store aggregate occupants.

This provides city-scale simulation without unnecessary computational cost.

---

# 17. EMPLOYMENT

Track:

- jobs
- workers
- unemployment
- job vacancies
- education requirements
- worker shortages

Different economic buildings can require different workforce types.

For example:

basic industry → mostly low/mid education

advanced offices → higher education

This gives education strategic importance.

---

# 18. EDUCATION

Education should develop over time.

Services:

- elementary school
- secondary school
- university

Track education categories.

Education influences:

- employment
- building development
- income
- advanced industry
- offices

Education should be a long-term investment.

---

# 19. CITY ECONOMY

The player manages a municipal budget.

Income:

- residential taxes
- commercial taxes
- industrial taxes
- office taxes
- transit fares where appropriate
- other sensible municipal revenue

Expenses:

- roads
- utilities
- education
- healthcare
- police
- fire
- garbage
- parks
- transportation

Show:

- current treasury
- income
- expenses
- net cash flow

Allow taxation adjustments.

Potentially allow department budgets later.

The economy should create pressure without making the game frustrating.

---

# 20. TAXATION

Allow separate tax rates for major zone types.

Taxes should create trade-offs.

Higher taxes:

+ municipal revenue

but potentially:

- lower demand
- lower satisfaction
- slower development

Extremely low taxes:

+ increased attractiveness

but potentially:

- insufficient municipal revenue

Avoid one obviously optimal tax rate.

---

# 21. ELECTRICITY

Track:

- production
- demand
- capacity
- availability

Possible power sources:

- wind
- solar
- gas/coal equivalent
- advanced cleaner generation

Different sources have:

- cost
- capacity
- pollution
- reliability

The electricity system can use network/coverage abstraction where appropriate.

It does not need unnecessarily complex electrical engineering simulation.

---

# 22. WATER

Track:

- water production
- demand
- sewage
- capacity

Infrastructure may include:

- pumps
- towers
- sewage treatment

Polluted water sources should potentially create consequences.

Make utility shortages obvious.

---

# 23. GARBAGE

Buildings produce waste.

Garbage services collect it.

Infrastructure can include:

- landfill
- recycling center
- advanced processing later

Poor garbage service can reduce:

- desirability
- health
- land value

Visible garbage trucks are desirable.

---

# 24. FIRE

Buildings have fire risk.

Risk may depend on:

- density
- building type
- service coverage

Fire stations provide coverage.

When fires occur:

- dispatch fire vehicles
- show visible incident
- allow potential building damage

Do not create fires so frequently that they become annoying.

---

# 25. POLICE

Track abstract crime levels.

Crime can be influenced by:

- population density
- unemployment
- education
- service coverage
- local conditions

Police stations reduce crime through coverage.

Police vehicles may patrol or respond to incidents.

---

# 26. HEALTHCARE

Healthcare influences city health and desirability.

Buildings:

- clinic
- hospital

Track:

- capacity
- coverage
- demand

Ambulances may respond to incidents.

Avoid unnecessarily detailed medical simulation.

---

# 27. PARKS

Parks improve:

- desirability
- happiness
- land value

Different parks can have:

- cost
- maintenance
- radius
- attractiveness

Parks should visually improve neighborhoods.

---

# 28. LAND VALUE

Land value should be one of CitySim's most important hidden-but-visible systems.

Positive influences:

- parks
- schools
- healthcare
- accessibility
- waterfront
- low crime
- good services

Negative influences:

- pollution
- heavy traffic
- noise
- garbage
- crime
- undesirable industry

Land value affects:

- building development
- tax revenue
- wealth
- desirability

Provide an excellent land-value overlay.

---

# 29. DESIRABILITY

Separate desirability from pure land value where useful.

Residential desirability may consider:

- pollution
- parks
- schools
- healthcare
- commute accessibility

Commercial desirability may consider:

- population
- traffic/accessibility
- wealth
- nearby activity

Industrial desirability may consider:

- transport
- workforce
- freight access
- land cost

This creates meaningful city geography.

---

# 30. POLLUTION

Track:

### AIR / GENERAL POLLUTION

### GROUND POLLUTION

### NOISE

Potential sources:

- industry
- power generation
- heavy traffic
- garbage
- highways

Pollution should spread spatially.

It should influence nearby development.

Use performant grid-based or field-based calculations rather than expensive agent simulation.

---

# 31. PUBLIC TRANSPORT

Begin with:

### BUS SYSTEM

Allow:

- bus stops
- route creation
- buses
- ridership
- operating cost

Later consider:

### RAIL

### METRO

### TRAM

if architecture and development time permit.

Transit should influence actual travel demand.

It should reduce some road traffic.

Track:

- ridership
- capacity
- cost
- route performance

---

# 32. FREIGHT AND TRADE

Industry should participate in an abstract but meaningful goods economy.

Industry creates goods.

Commercial areas consume goods.

Surplus/shortage can be handled through external trade.

Freight traffic should therefore appear naturally.

Industry needs good transportation connections.

Severe congestion can hurt freight efficiency.

This creates an important relationship between:

INDUSTRY

→ FREIGHT

→ ROADS

→ COMMERCIAL ACTIVITY.

Do not model individual product inventories unless useful.

---

# 33. DISTRICTS

Allow players to paint and name districts.

District statistics:

- population
- jobs
- traffic
- land value
- education
- crime
- pollution
- tax contribution

Later support policies.

Possible policies:

- recycling
- transit encouragement
- heavy traffic restriction
- energy conservation
- industrial incentives

Policies should have trade-offs.

---

# 34. CITY PROGRESSION

CitySim should gradually unlock complexity.

Example ORIGINAL progression:

Settlement

Village

Town

Regional Center

Small City

Major City

Metropolis

Use original naming if desired.

Unlocks can include:

- advanced roads
- services
- density
- transit
- policies
- advanced utilities

Unlocking everything immediately would overwhelm new players.

---

# 35. CITY GROWTH MUST LOOK GOOD

One of the game's greatest rewards should be watching the skyline change.

A small settlement should visually differ dramatically from a metropolis.

Growth should create:

- denser roads
- taller buildings
- increased traffic
- increased lights
- more transit
- more services
- more activity

The player should occasionally want to stop managing and simply watch their city.

---

# 36. DATA OVERLAYS

Implement high-quality overlays for:

- traffic
- zoning
- population
- land value
- desirability
- pollution
- noise
- electricity
- water
- education
- healthcare
- police
- fire
- garbage
- employment
- public transportation

Overlays must:

- have legends
- update correctly
- be readable
- derive from REAL simulation data

Never fake an overlay.

---

# 37. STATISTICS

Create a polished city statistics interface.

Graph over time:

- population
- jobs
- unemployment
- treasury
- income
- expenses
- RCI demand
- land value
- education
- traffic
- electricity
- water
- garbage
- transit ridership

Charts should be attractive and readable.

Do not show meaningless statistics merely to make the game look complicated.

---

# 38. INSPECTORS

Clicking objects should provide contextual information.

### BUILDINGS

Show:

- type
- development level
- occupants/jobs
- taxes
- land value
- current problems
- utility status

### ROADS

Show:

- type
- speed
- traffic level
- maintenance

### SERVICE BUILDINGS

Show:

- capacity
- usage
- coverage
- budget
- vehicles where relevant

### VEHICLES

Optional information:

- type
- destination
- task

Do not overload inspectors.

---

# 39. NOTIFICATIONS

Use contextual notifications.

Examples:

- power shortage
- water shortage
- unemployment
- worker shortage
- garbage buildup
- traffic problems
- budget deficit
- service capacity problems
- abandoned buildings

Clicking a notification should focus the relevant area where possible.

Avoid notification spam.

---

# 40. DAY/NIGHT

If technically practical, implement a day/night cycle.

Nighttime should include:

- building lights
- streetlights
- headlights
- attractive city illumination

Night must remain playable.

Allow visual day/night behavior to be disabled or locked if desired.

Day/night does NOT need an overly complicated hourly economy.

Use abstraction.

---

# 41. WEATHER

Weather can include:

- clear
- cloudy
- rain
- fog
- storms

Primarily use weather for atmosphere.

Minor simulation effects are acceptable.

Do not build an entire meteorological simulator.

---

# 42. CONSTRUCTION

Buildings should have construction states.

Example:

foundation

→ frame

→ near-complete

→ finished

This can be visually simplified.

Construction activity makes growth feel physical.

Include:

- cranes where appropriate
- construction particles
- temporary textures/states

---

# 43. CITY EVENTS

Occasional events can include:

- economic boom
- downturn
- storm
- heat wave
- major fire
- migration increase
- festival
- infrastructure problem

Events should create variation.

Avoid constant random punishment.

---

# 44. CITY HISTORY

Record important events.

Examples:

- founding date
- population milestones
- first school
- first hospital
- first transit route
- major fires
- highest population
- financial crises
- major infrastructure construction

Create a simple city timeline.

This gives each save personality.

---

# 45. SIMULATION-DRIVEN NEWS

Create a small local news ticker.

IMPORTANT:

News should reference ACTUAL simulation conditions.

Example:

If downtown traffic is genuinely severe:

"Evening congestion continues along Central Avenue."

If unemployment falls significantly:

"Local employers report growing demand for workers."

Use procedural/generated city and street names.

Keep writing concise.

Do not let the news system dominate the UI.

---

# 46. PROCEDURAL NAMES

Generate original names for:

- streets
- businesses
- schools
- parks
- districts
- hospitals

Allow renaming.

This adds personality cheaply.

---

# 47. SAVE SYSTEM

NON-NEGOTIABLE.

Implement:

- manual saving
- loading
- autosave
- multiple saves
- save metadata
- version field
- corruption/error handling

Save all meaningful simulation state.

TEST SAVING.

TEST LOADING.

TEST SAVING AGAIN AFTER LOADING.

Do not leave this until the final development phase.

---

# 48. TIME

Provide:

PAUSE

NORMAL

FAST

VERY FAST

Simulation correctness must not depend on frame rate.

Use simulation ticks.

---

# 49. SIMULATION ARCHITECTURE

Different systems should update at different frequencies.

Example:

### HIGH FREQUENCY

- visible vehicle movement
- animations

### MEDIUM FREQUENCY

- traffic state
- service dispatch
- development checks

### LOW FREQUENCY

- economy
- land value
- education
- demand
- demographics

Do not recalculate the entire city every frame.

---

# 50. PERFORMANCE

CitySim should eventually support substantial cities.

Design accordingly from the beginning.

Use techniques such as:

- simulation ticks
- spatial grids
- spatial partitioning
- object pooling
- route caching
- dirty-region updates
- batched calculations
- statistical population
- rendering culling
- level of detail
- incremental calculations

Separate:

SIMULATION STATE

from

VISUAL REPRESENTATION.

A city containing 50,000 statistical residents does NOT require rendering or individually updating 50,000 people.

---

# 51. USER INTERFACE

THIS IS A MAJOR PRIORITY.

CitySim should have a UI that looks intentionally designed.

Not:

"default engine buttons arranged by a programmer."

Create a coherent UI design system.

Use consistent:

- fonts
- spacing
- panel sizes
- corners
- borders
- icons
- shadows
- animation
- hover states
- selection states
- tooltips

The UI should feel modern while complementing the semi-pixel-art world.

---

# 52. MAIN HUD

Potential structure:

### TOP

City name and progression.

### BOTTOM

Main construction toolbar.

Categories:

- roads
- zoning
- electricity
- water
- services
- parks
- transport
- demolition

### CORNER

Display:

- money
- income
- population
- demand

### TIME CONTROLS

Clearly visible but unobtrusive.

Do not cover large portions of the map unnecessarily.

---

# 53. UI POLISH REQUIREMENTS

Every major screen must be visually inspected.

Look specifically for:

- clipping
- overlapping
- bad alignment
- inconsistent margins
- tiny text
- unreadable colors
- ugly defaults
- excessive borders
- giant panels
- confusing hierarchy
- missing hover feedback
- inconsistent button sizing
- panels extending off-screen

Fix these.

Support common desktop resolutions.

Support UI scaling if practical.

---

# 54. MAIN MENU

Create a polished main menu.

CITYSIM

NEW CITY

LOAD CITY

SETTINGS

CREDITS

QUIT where appropriate

Use an attractive city background or live/generated scene if practical.

The first screen should immediately communicate:

"city builder."

---

# 55. SETTINGS

Provide meaningful settings.

### GRAPHICS

- resolution/display mode where relevant
- quality
- shadows
- effects

### AUDIO

- master
- music
- ambience
- effects
- UI

### GAMEPLAY

- autosave interval
- camera speed
- edge scrolling
- tutorial

### ACCESSIBILITY

Where practical:

- UI scale
- colorblind-friendly overlays
- reduced motion

Persist settings.

---

# 56. AUDIO

Build an audio system for:

- UI
- construction
- vehicles
- ambience
- emergency services
- weather
- music

Use only appropriately licensed, original, generated-with-appropriate-rights, or public-domain assets.

City ambience should become richer as population increases.

---

# 57. TUTORIAL

Teach through contextual guidance.

Suggested order:

roads

↓

zoning

↓

power/water

↓

RCI demand

↓

services

↓

finances

↓

traffic

Do not dump ten paragraphs onto the player.

Tutorials must be skippable.

---

# 58. POLISH

Once systems work, add tasteful polish.

Examples:

- construction dust
- subtle UI animations
- hover highlighting
- animated money changes
- emergency lights
- vehicle headlights
- smoke
- moving clouds
- animated water
- birds
- trees moving
- city ambience
- milestone celebration
- building lights
- tiny pedestrians
- responsive cursor
- satisfying placement sounds

Small details compound.

---

# 59. DEBUG TOOLS

Build development tools early.

Include useful debug views for:

- FPS
- simulation time
- road graph
- traffic
- pathfinding
- zone cells
- building state
- utility coverage
- service coverage
- land value
- demand calculations

Debug visualization should be disableable.

Use these tools yourself when diagnosing problems.

---

# 60. AUTOMATED TESTS

Test core simulation logic where practical.

Prioritize:

- world generation
- pathfinding
- demand
- economy
- taxation
- utilities
- save/load serialization
- zoning
- development conditions

Do not waste enormous effort testing trivial visual code while leaving critical simulation logic untested.

---

# 61. MANUAL QA

YOU ARE RESPONSIBLE FOR RUNNING THE GAME.

Do not assume functionality because code compiled.

Test things.

Try to break them.

Examples:

- spam road placement
- demolish intersections
- create disconnected neighborhoods
- remove power
- run out of money
- create massive zoning areas
- create extreme taxes
- create severe congestion
- rapidly change simulation speed
- save during activity
- reload
- build near map boundaries
- open/close UI repeatedly
- test different resolutions

Look for:

- crashes
- exceptions
- broken paths
- stuck vehicles
- impossible finances
- duplicated entities
- negative populations
- broken saves
- UI clipping
- memory/performance problems

FIX problems.

---

# 62. BUG-FIXING RULE

When a bug appears:

1. reproduce it
2. identify root cause
3. fix root cause
4. retest
5. check related functionality

Do not simply hide symptoms.

Do not claim something is fixed unless it has been retested.

---

# 63. VISUAL QA

Regularly inspect the actual rendered game.

Inspect:

- main menu
- empty map
- early settlement
- medium city
- dense city
- roads
- zoning
- traffic
- overlays
- construction
- nighttime
- rain
- major UI screens

Something can be technically correct and still look terrible.

Visual problems count as bugs.

---

# 64. PROJECT STRUCTURE

Maintain professional architecture.

Organize systems logically.

Conceptual structure:

/assets
/src
/simulation
/world
/transport
/economy
/services
/ui
/data
/audio
/tests
/tools
/docs

Adapt to the actual technology.

Avoid:

- giant files
- circular dependencies
- global-state chaos
- duplicate managers
- magic constants everywhere

---

# 65. DOCUMENTATION

Maintain:

README.md

ARCHITECTURE.md

CHANGELOG.md

ASSET_CREDITS.md

README should eventually contain:

- overview
- screenshots
- requirements
- installation
- controls
- development setup
- architecture summary
- license
- known limitations

---

# 66. GITHUB READINESS

This project will eventually be published on GitHub after user approval.

Therefore:

- no secrets
- no private keys
- no machine-specific paths
- use relative asset paths
- include dependency information
- include .gitignore
- keep repository clean
- document setup
- ensure fresh clones can run

DO NOT deploy or publish anything until explicitly instructed.

---

# 67. ORIGINALITY / ASSETS

Never steal assets.

Use:

- original artwork
- procedural assets
- appropriately licensed assets
- public-domain resources
- generated assets with appropriate rights

Record third-party resources in ASSET_CREDITS.md.

---

# 68. DO NOT FAKE SIMULATION

This is critical.

If traffic overlays exist:

they must reflect actual traffic.

If land value changes:

real factors must cause it.

If a business lacks workers:

there must actually be a worker shortage.

If the news ticker mentions congestion:

the congestion should exist.

If commercial buildings need goods:

the goods economy must actually influence them.

Do not create fake complexity.

---

# 69. BUT DO NOT OVER-SIMULATE

This is equally important.

Do not waste enormous resources simulating details invisible to the player.

CitySim is NOT:

- a human life simulator
- an economics research model
- a microscopic traffic engineering program
- a utility engineering simulator

It is a GAME.

Simulation exists to create:

DECISIONS.

PROBLEMS.

CONSEQUENCES.

STORIES.

If two implementation approaches create equally convincing gameplay, prefer the simpler and more performant architecture.

---

# 70. DEVELOPMENT APPROACH

This specification is the permanent design target.

Do NOT attempt to recklessly implement everything simultaneously.

Work in large, meaningful phases.

Each phase should involve substantial development.

However, unlike a one-shot generation task, you have permission to iterate repeatedly within each phase.

Use the following workflow:

INSPECT

↓

PLAN

↓

IMPLEMENT

↓

RUN

↓

TEST

↓

VISUALLY INSPECT

↓

FIX

↓

RUN AGAIN

↓

POLISH

↓

STABLE CHECKPOINT

Do not stop at IMPLEMENT.

---

# 71. PHASE 1 — THE CITY EXISTS

Build a substantial first playable version.

Implement:

- project architecture
- map/world
- terrain generation
- camera
- road construction
- road graph
- zoning
- residential development
- commercial development
- industrial development
- construction states
- initial building variety
- basic population model
- employment
- basic RCI demand
- money
- taxation
- electricity
- water
- demolition
- simulation clock
- speed controls
- save/load foundation
- polished HUD
- construction toolbar
- building inspector
- basic statistics
- notifications
- main menu
- settings foundation
- debug tools

At the end:

I should be able to start with empty land and build a functional town.

Do not return with merely a technical framework.

MAKE IT PLAYABLE.

---

# 72. PHASE 2 — THE CITY WORKS

Implement:

- deeper RCI
- land value
- desirability
- building upgrades
- abandonment
- education
- healthcare
- police
- fire
- garbage
- parks
- pollution
- noise
- improved economy
- service coverage
- service vehicles
- improved traffic
- traffic overlay
- additional data overlays
- city progression
- improved statistics
- procedural naming
- visual improvements

At completion:

the player should genuinely need to PLAN.

---

# 73. PHASE 3 — THE CITY MOVES

Implement:

- advanced roads
- one-way roads
- larger roads
- highways where appropriate
- improved intersections
- deeper congestion simulation
- buses
- bus routes
- transit demand
- freight
- external trade
- office zoning
- high-density zoning
- districts
- policies
- additional transportation if appropriate
- advanced data analysis

At completion:

transportation should become a major strategic system.

---

# 74. PHASE 4 — THE CITY FEELS ALIVE

Implement:

- day/night
- weather
- improved ambience
- city history
- simulation-driven news
- construction animation improvements
- city events
- neighborhood identity
- richer inspectors
- improved tutorial
- accessibility
- audio polish
- environmental animation
- UI animation
- city visual polish
- achievements if appropriate

At completion:

watching the city should itself be enjoyable.

---

# 75. PHASE 5 — RELEASE QUALITY

STOP prioritizing features.

Now prioritize:

- bugs
- performance
- UX
- balance
- polish

Stress test increasingly large cities.

Test approximate population scales such as:

1,000

5,000

10,000

25,000

50,000+

where supported.

Profile:

- pathfinding
- traffic
- rendering
- simulation
- UI
- memory
- saving/loading

Optimize bottlenecks.

Perform regression testing.

Audit every menu.

Audit every major tool.

Audit every overlay.

Audit save/load.

Audit settings.

Audit new game.

Audit long simulations.

Fix economic exploits.

Fix visual bugs.

Remove development artifacts.

Update documentation.

Prepare for GitHub release.

DO NOT publish until instructed.

---

# 76. QUALITY PRIORITY

When compromises are necessary, prioritize:

1. STABILITY
2. GAMEPLAY
3. SIMULATION INTEGRITY
4. USER EXPERIENCE
5. PERFORMANCE
6. VISUAL POLISH
7. SIMULATION DEPTH
8. CONTENT VARIETY
9. OPTIONAL FEATURES

A smaller excellent system beats a huge broken system.

---

# 77. ANTI-AI-SLOP RULES

Do NOT:

- make giant monolithic scripts
- build fake systems
- create placeholder buttons and call them complete
- leave major TODOs indefinitely
- generate dozens of unnecessary files
- repeatedly rewrite functioning architecture
- duplicate logic
- ignore errors
- create ugly default UI
- claim you tested something you did not run
- claim a feature works without verifying it
- prioritize feature count over quality
- generate massive amounts of code without testing

If something is visibly bad:

improve it.

If something is confusing:

redesign it.

If something is broken:

fix it.

---

# 78. AUTONOMY

Act like the project's lead developer.

You may independently make sensible:

- architecture decisions
- algorithm decisions
- UX decisions
- visual decisions
- performance decisions

Do not repeatedly ask for approval over minor implementation details.

If a specification would cause serious architectural problems, implement a smarter solution preserving its gameplay intention.

Document major deviations.

---

# 79. IMPORTANT DEVELOPMENT BEHAVIOR

Do not spend most of a development turn telling me what you are ABOUT to do.

Do the work.

Use available tools.

Inspect files.

Write code.

Run the project.

Interact with the game where possible.

Inspect screenshots/rendering where possible.

Read errors.

Fix them.

Run tests.

Repeat.

Your output message is secondary.

The working game is primary.

---

# 80. PHASE REPORT

At the completion of each major phase, provide:

## IMPLEMENTED

What was actually completed.

## TESTED

What was actually executed and tested.

## FIXED

Important bugs discovered during development.

## PERFORMANCE

Observed performance and major bottlenecks.

## KNOWN ISSUES

Real remaining problems only.

## ARCHITECTURE CHANGES

Any significant design decisions.

## NEXT PHASE

The next major milestone.

Then STOP.

Allow me to test the game.

Do not automatically begin the next major phase.

---

# 81. BETWEEN-PHASE POLISH PASSES

If I provide feedback after testing a phase:

DO NOT immediately rush into the next phase.

Treat my feedback as a stabilization pass.

Reproduce reported problems.

Fix them.

Improve weak areas.

Test again.

Only proceed once the existing foundation is healthy.

Preserving a strong foundation is more important than racing through the roadmap.

---

# 82. CITYSIM'S IDENTITY

CitySim should NOT primarily be:

"Cities: Skylines but smaller."

It should develop its own identity.

Its strengths should be:

### CLASSIC CITY-BUILDER READABILITY

The player can understand why the city behaves as it does.

### DEEP BUT APPROACHABLE SYSTEMS

Enough simulation to create strategy without pointless microscopic complexity.

### BEAUTIFUL MINIATURE CITY

Watching the city grow should be rewarding.

### EXCELLENT DATA VISUALIZATION

Complexity becomes understandable through overlays and statistics.

### FAST INTERACTION

Building and modifying the city feels responsive.

### EMERGENT URBAN STORIES

Interesting situations arise naturally from interacting systems.

---

# 83. THE TARGET EXPERIENCE

The player notices commercial demand rising.

They zone a new commercial district.

Businesses develop.

Traffic increases.

A nearby intersection becomes congested.

Freight deliveries slow down.

Several shops begin struggling.

The player opens the traffic overlay.

They discover nearly every delivery vehicle is using one arterial.

They build another connection.

Traffic redistributes.

Commercial accessibility improves.

Businesses recover.

Land values increase.

Buildings upgrade.

Tax revenue rises.

The city can now afford a new school.

Education improves.

Higher-skilled businesses become viable.

The skyline changes.

That chain reaction is CitySim.

Not because it was scripted.

Because the systems interacted.

---

# 84. FINAL STANDARD

CitySim should create the feeling:

**"I'll just fix this one thing."**

The player fixes an intersection.

Then notices a neighborhood lacks schools.

Then notices the city is losing money.

Then realizes the industrial district has terrible freight access.

Then builds a highway.

Then accidentally creates another traffic bottleneck.

Then discovers residential demand has exploded.

An hour disappears.

That is the target.

The simulation should be understandable enough that the player believes:

**"I caused this."**

And:

**"I know how I might fix it."**

Build CitySim around that feeling.

---

# 85. YOUR FIRST TASK

Begin by inspecting the available development environment and any existing project.

Determine the most appropriate technical approach.

Before major implementation, establish:

- engine/framework
- project architecture
- simulation architecture
- rendering strategy
- world representation
- transportation graph representation
- save architecture
- UI architecture
- performance strategy

Record important decisions in ARCHITECTURE.md.

Do NOT spend an entire development cycle merely planning.

Once the architecture is sufficiently defined:

**BEGIN PHASE 1 IMMEDIATELY.**

Implement a substantial portion of Phase 1.

Run the game.

Test it.

Visually inspect it.

Fix issues.

Continue until you reach a sensible stable checkpoint.

The permanent rule for this project is:

**Never optimize for how much code you can generate. Optimize for how good CitySim becomes.**

Begin.