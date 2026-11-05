# EV Route — continuation handoff

Read README.md and AGENTS.md. Keep the app free; do not enable billing, paid APIs or paid fallbacks. Repository remains with sinanryanhatay; brother can fork and use Claude Code or Codex. GitHub commits do not automatically deploy the original Sites app.

## Files
- app.mjs: UI orchestration, route/terrain metrics, stale-request cancellation, stop plan display/export.
- trip.mjs: OSRM road request and baseline metric validation.
- terrain.mjs: road-distance resampling, Open-Meteo elevation, payload-dependent terrain energy and SOC trace.
- chargers.mjs: regional eŞarjRadar/EPDK requests, dated registry metadata, strict network/connector/power filtering.
- planner.mjs: bounded forward greedy stop selection (90% level-road candidate reach, 8 km spacing to avoid a cluster crowding out earlier stops); actual routed/elevation-checked legs; floor max(20,reserve)+buffer; charge to100%; max6 stops/24 route checks. No claim of global optimum or exhaustive feasibility.
- free-map.mjs/search.mjs: OpenFreeMap pins/road line, Photon autocomplete.
- export.mjs: complete ordered Google URL export, mobile waypoint limits.
- engine.mjs: existing consumption/charge model and historical sample optimizer. google.mjs is unused historical paid adapter.

## Verified
37 tests cover energy/reserve/summits, exports, coordinates, terrain increase/ascent, strict station filtering, road leg rechecks, charge jumps, missing-data rejection and Registry/OSM IDs not being sent as Google Place IDs. Browser tests verify real elevation and station responses, not just fixtures. See README for observed coverage limits.

## Constraints and next work
Maintain the open eŞarjRadar feed attribution and date display. Do not label listed station maximum power as guaranteed connector power. Preserve access/road checks; drivers must confirm station status. Refresh bundled province bounds and dated ŞarjKaç price references with `python3 refresh-data.py`; this uses curl to fetch their openly published JSON endpoints. The tariff reference is not live and does not silently overwrite user tariffs. Check EPDK Şarj@TR/operator apps for actual socket prices and status. No direct EPDK API integration is claimed.

Improve greedy search to bounded graph search/backtracking and compare target SOC/time/cost. Current100% stop target is conservative but slow. Terrain uses max100 points per leg, DEM90m, roughly2km spacing; adaptive crest sampling would be better. Simplified speed/temperature/wind/mass/charging curves need vehicle calibration. Unknown power has unknown duration.

Do not promise never falling below20%. Enforce the floor at every sampled point; don't check only final arrival. Never silently drop failed elevation or replace failed live data with fixtures. Keep complete export disabled until the whole plan succeeds, and clear it on settings/address changes. Google may choose different roads; preserve this caveat.

Free-service endpoints/attributions/privacy are in README. Review public API usage policy before scale/commercial use. No credentials or original Sites project identity belong in this portable GitHub repository.

## Vehicle profiles
“My vehicle” manages up to 30 editable profiles saved in localStorage (`ev-route-vehicles-v1`). Existing capacity/consumption migrate into the Atto 3 starter profile. The bundled catalogue is community-sourced, with a separately checked BYD Turkey entry; no universal verified manufacturer catalogue is claimed. Profiles contain name/year, usable capacity, baseline highway consumption, car weight excluding occupants, AC/DC limits and supported connectors (CCS2 / Type 2). Switching updates energy, payload-sensitive terrain, SOC and charger compatibility; existing charging plans are invalidated and replanned. Route distance and traffic-free road time do not change merely because a different car is selected. Reset preserves the active vehicle. The main consumption input updates that profile.

`vehicles.mjs` validates and migrates profiles. Charging taper is a generic curve scaled to the profile DC limit; AC uses its separate limit. A mixed station with only a site maximum has unknown AC power, avoiding use of DC power for AC estimates. No cross-device sync. Browser storage denial means session-only profiles.

## Automatic vehicle catalogue
Choose brand → model → exact model year → version/battery in My vehicle. Selecting a version automatically fills every profile field; Save & use applies it. Specifications stay under an optional disclosure. Existing profiles remain intact; selecting a previously saved catalogue ID updates that profile only when saved. The trip speed slider remains independent and adjustable. 130 km/h is only the stored consumption reference, not a fixed driving speed.

`vehicle-catalog.json` contains 583 variants across 31 brands: complete CCS2 records with European-market coverage from OpenEV Data v1.24.0 (generated 2025-12-30), plus BYD Türkiye’s 2025 Atto 3 Design. Imported 2026-11-05. No live API, billing or key. Not all brands/years are available; never substitute a nearby year or different battery. Community specifications can be wrong or differ from Turkish trims. Incomplete/unsupported/non-European records are excluded.

OpenEV data is redistributed with `dist/vehicle-data-license.txt` (CDLA-Permissive-2.0). Source release: https://github.com/open-ev-data/open-ev-data-dataset/releases/tag/v1.24.0 . Refresh deliberately: download that release JSON and run `python3 import-vehicles.py /path/to/open-ev-data-v1.24.0.json`; review source/schema/license before upgrading. Do not execute downloaded code. Tests validate every resulting record and exact-year filtering.

Highway consumption is NOT WLTP consumption: the importer estimates a reference at130 km/h from drag area (Cd × width × height ×0.84 where known, otherwise0.70 m²), air density1.225, rolling resistance0.01, drivetrain efficiency0.90, auxiliary0.7kW, and75kg driver. This generic estimate is visibly labelled and user-editable. Preserve the existing speed adjustment model. BYD TR uses the earlier23kWh/100km highway assumption; its official16.0 WLTP combined is only context. Brochure lists60.48kWh without separating usable capacity, so that is explicitly a planning assumption; DC110kW, AC11kW, mass1750kg are from the1July2025 brochure. Existing manual Atto profiles are not silently overwritten.

## City-centre endpoint fix
The original trip accepted address pins up to 1 km from a road, while charging legs incorrectly used a 100 m limit for every endpoint. Photon’s Istanbul city point is about 132 m from the OSRM road network; all charger legs failed before any battery calculation. `fetchRoad` now supports separate start/end radiuses. The planner preserves 1 km for the original origin/destination and 100 m for charging-station endpoints, including departures from stations. Reserve thresholds and terrain checks are unchanged. Road-access failures are reported separately from below-reserve candidates, and bounded-search failure is not presented as proof a trip is impossible. Regression tests enforce the endpoint distinction.
