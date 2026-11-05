# EV Route

Free personal/non-commercial EV trip planner for Turkey. Public app: https://atto-route-sinan.srh34.chatgpt.site · GitHub: https://github.com/sinanryanhatay/ev-route

## Run
`python3 -m http.server 4173 --directory dist`

`node --test tests/*.test.mjs` — 45 tests. No build step, framework or API keys.

## Current functionality
- OpenFreeMap / MapLibre road map, Photon address autocomplete and browser current location.
- OSRM real driving route and distance/time.
- Open-Meteo Copernicus DEM GLO-90 elevation sampled along road geometry; climbing energy depends on vehicle plus payload mass. Downhill recovery is conservative and net energy per segment cannot be negative.
- Six trip metrics and battery profile. The chosen speed is a consumption scenario applied across the distance; OSRM time uses its own road speeds and excludes traffic.
- Find charging stops queries eŞarjRadar’s open EPDK-derived regional station feed. It respects selected networks, documented compatible connectors and the fast-only setting.
- Each accepted charging leg is individually road-routed (100 m charger road snap; original 1 km tolerance for city/address endpoints), elevation-sampled and battery-checked. The floor is max(20%, selected reserve) + buffer. Plans use the selected 80% or 100% departure at stops and up to six stops; this is a bounded forward greedy search, NOT globally fastest/cheapest optimization.
- Stop names/coordinates/source links, expected arrival/departure, assumed-tariff cost and charging time where station maximum power is listed. Exclude/replan and ordered Google Maps export with mobile-safe split links.
- Edited inputs invalidate the charging plan and disable its export. API failures or insufficient data never substitute sample stations.

## Important data limits
Station records come from eŞarjRadar (https://esarjradar.com/veri/), based on EPDK records, with source/update dates per stop. Province files are fetched on demand; a bundled 81-province bounding index narrows requests and may miss newly added coverage outside the padded bounds. Station power is a listed site maximum, not a guarantee for each socket. The feed does not provide verified live availability, working condition, opening/access or queues. Confirm in the operator app / EPDK Şarj@TR.

The ŞarjKaç price comparison panel is a bundled dated reference (https://www.sarjkac.com/api/prices), not automatically live. Each operator’s verification date and official tariff link are shown. Planning costs use editable assumed tariffs; membership, socket/location differences and idle fees are not included. The registry feed’s price fields are intentionally not used. Run `python3 refresh-data.py` to refresh regional bounds and tariff references before republishing; requires Python3 and curl.

This is an estimate, not a guarantee of staying above 20%. DEM terrain samples are about 2 km apart, coarser on long legs (100 samples maximum per leg); small hills, bridges/tunnels and road gradients can be missed. Vehicle model and charging curve are illustrative, not calibrated MY25 telemetry. Public API availability is best-effort. No traffic/weather/road-speed telemetry.

Choose 80% (default) or 100% for charging stops. The selected target controls subsequent reach, charge energy, time and assumed cost; it never changes starting battery. No silent upgrade to 100% occurs. Unknown station power produces unknown charging time, not a made-up duration. Costs use your input tariffs and 92% assumed charging efficiency.

## Services and privacy
- Map: OpenFreeMap, MapLibre 5.12.0 from unpkg; OSM attribution retained.
- Search: Photon public demo; >=3 characters, 550 ms debounce, bounded session cache.
- Routing: router.project-osrm.org; coordinates sent on calculation and stop planning.
- Elevation: api.open-meteo.com, Copernicus DEM GLO-90; free non-commercial endpoint. Route samples sent for elevation, cached in memory.
- Stations: esarjradar.com/api/il/…; regional records fetched with three concurrent requests and 15-minute session cache. Attribution: eŞarjRadar / EPDK. It receives selected regional requests, not precise route coordinates.

No billing setup, keys, paid fallback, backend storage or account. Preferences stay in local browser storage. Free public services have usage/availability limits. Commercialization needs a fresh service-policy review. Google Maps may choose different roads after handoff and receives stops but no battery targets.

`engine.mjs` retains the old sample optimizer for development/tests. The UI does not run that fixture. `google.mjs` is historical unused code; do not connect billed APIs without explicit owner authorization.

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

Charging target is a browser-saved trip preference (`chargeTarget`), independent of vehicle and starting battery. Changing it clears stale charging plans and exports; select Find charging stops again. Every leg still enforces the reserve plus buffer.

## Driver experience review
One main action now calculates the road route and then the complete charging plan. Both 80% (default) and 100% targets are supported; no silent upgrade. Main summary shows total driving + stop time, assumed-tariff cost, arrival/minimum battery, distance and stop count. Energy/ascent/payload details, station specifications, tariff comparison and privacy/source explanations remain in expandable sections. Google Maps export is next to the summary; more than three stops retains explicit mobile-part guidance. Vehicle access works on mobile.

Fixed during review: hidden mobile vehicle control, invalid occupant/buffer/reserve input acceptance, incomplete terrain profiles silently passing, missing total charging cost/time, and time rounding displaying 1h60m. Input changes cancel old charging plans and disable export. Unknown charge duration remains unknown in total time. Automated coverage includes 80% needing more stops than100%, terrain rejection, summary totals, duration rounding and input validation.

Remaining limits: bounded greedy routing can miss feasible/better routes; no live charger occupancy/queue or socket-level prices; no live traffic/weather, road closures, toll preferences or amenity dataset; vehicle consumption and taper are estimates. Next priorities are bounded backtracking with alternative stops, route-option comparison, and documented live operator integrations when freely available. Do not invent these data or advertise live availability. Google Maps navigation can recalculate roads; battery/charging amounts stay in EV Route.
