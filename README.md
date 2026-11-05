# EV Route

Free personal/non-commercial EV trip planner for Turkey. Public app: https://atto-route-sinan.srh34.chatgpt.site · GitHub: https://github.com/sinanryanhatay/ev-route

## Run
`python3 -m http.server 4173 --directory dist`

`node --test tests/*.test.mjs` — 27 tests. No build step, framework or API keys.

## Current functionality
- OpenFreeMap / MapLibre road map, Photon address autocomplete and browser current location.
- OSRM real driving route and distance/time.
- Open-Meteo Copernicus DEM GLO-90 elevation sampled along road geometry; climbing energy depends on vehicle plus payload mass. Downhill recovery is conservative and net energy per segment cannot be negative.
- Six trip metrics and battery profile. The chosen speed is a consumption scenario applied across the distance; OSRM time uses its own road speeds and excludes traffic.
- Find charging stops queries eŞarjRadar’s open EPDK-derived regional station feed. It respects selected networks, documented compatible connectors and the fast-only setting.
- Each accepted charging leg is individually road-routed (maximum 100 m road snap), elevation-sampled and battery-checked. The floor is max(20%, selected reserve) + buffer. Plans use 100% departure at stops and up to six stops; this is a bounded forward greedy search, NOT globally fastest/cheapest optimization.
- Stop names/coordinates/source links, expected arrival/departure, assumed-tariff cost and charging time where station maximum power is listed. Exclude/replan and ordered Google Maps export with mobile-safe split links.
- Edited inputs invalidate the charging plan and disable its export. API failures or insufficient data never substitute sample stations.

## Important data limits
Station records come from eŞarjRadar (https://esarjradar.com/veri/), based on EPDK records, with source/update dates per stop. Province files are fetched on demand; a bundled 81-province bounding index narrows requests and may miss newly added coverage outside the padded bounds. Station power is a listed site maximum, not a guarantee for each socket. The feed does not provide verified live availability, working condition, opening/access or queues. Confirm in the operator app / EPDK Şarj@TR.

The ŞarjKaç price comparison panel is a bundled dated reference (https://www.sarjkac.com/api/prices), not automatically live. Each operator’s verification date and official tariff link are shown. Planning costs use editable assumed tariffs; membership, socket/location differences and idle fees are not included. The registry feed’s price fields are intentionally not used. Run `python3 refresh-data.py` to refresh regional bounds and tariff references before republishing; requires Python3 and curl.

This is an estimate, not a guarantee of staying above 20%. DEM terrain samples are about 2 km apart, coarser on long legs (100 samples maximum per leg); small hills, bridges/tunnels and road gradients can be missed. Vehicle model and charging curve are illustrative, not calibrated MY25 telemetry. Public API availability is best-effort. No traffic/weather/road-speed telemetry.

Charging targets currently use 100% for conservatism and can be slow. Unknown station power produces unknown charging time, not a made-up duration. Costs use your input tariffs and 92% assumed charging efficiency.

## Services and privacy
- Map: OpenFreeMap, MapLibre 5.12.0 from unpkg; OSM attribution retained.
- Search: Photon public demo; >=3 characters, 550 ms debounce, bounded session cache.
- Routing: router.project-osrm.org; coordinates sent on calculation and stop planning.
- Elevation: api.open-meteo.com, Copernicus DEM GLO-90; free non-commercial endpoint. Route samples sent for elevation, cached in memory.
- Stations: esarjradar.com/api/il/…; regional records fetched with three concurrent requests and 15-minute session cache. Attribution: eŞarjRadar / EPDK. It receives selected regional requests, not precise route coordinates.

No billing setup, keys, paid fallback, backend storage or account. Preferences stay in local browser storage. Free public services have usage/availability limits. Commercialization needs a fresh service-policy review. Google Maps may choose different roads after handoff and receives stops but no battery targets.

`engine.mjs` retains the old sample optimizer for development/tests. The UI does not run that fixture. `google.mjs` is historical unused code; do not connect billed APIs without explicit owner authorization.
