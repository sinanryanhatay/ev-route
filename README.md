# EV Route

A static EV trip-planning prototype for Turkey, with a real **OpenFreeMap** map and **Google Maps URL navigation**. No API key, billing account or paid Google service is required by the active app.

Public app: https://atto-route-sinan.srh34.chatgpt.site
Source: https://github.com/sinanryanhatay/ev-route
Read [HANDOFF.md](HANDOFF.md) before continuing development in Claude Code or Codex.

## Run and test

Serve locally: `python3 -m http.server 4173 --directory dist`

Tests (Node 20+): `node --test tests/*.test.mjs` — 17 tests.

No build step or package installation is needed. An internet connection and WebGL support are needed for the map. MapLibre GL JS/CSS 5.12.0 loads from unpkg; map style/tiles/glyphs load from OpenFreeMap. Required provider attribution remains visible.

## Implemented

- Real, pannable/zoomable OpenStreetMap geography using OpenFreeMap and MapLibre.
- Current-location button beside From; runs only when clicked and requires browser permission. No automatic location request.
- Set start / Set destination on the map; latitude/longitude inputs produce A/B pins. Free Google Maps navigation works with those coordinates or typed addresses.
- Complete Google Maps export of selected sample charging stops, in order; mobile-safe splitting preserves all stops.
- Sample Zekeriyaköy–Urla charging optimizer with reserve/buffer, speed, passenger and luggage weight, total payload override, network filters and charging priorities.
- Saved preferences, editable consumption/weather/tariff assumptions, stop exclusion and battery chart.

## Important scope

**The map is real; the EV itinerary is still a sample.** OpenFreeMap provides display tiles, not road routing, geocoding, elevation or reliable charger data. Typed place names are not automatically geocoded. Use map selection/current location to position exact pins. Sample chargers are not plotted because their coordinates have not been verified. No invented road polyline is drawn. A new origin/destination can open in Google Maps, but does not get a fabricated EV charging plan.

The active app does not import `google.mjs`, load Google's SDK, or expose a paid API-key setup. `google.mjs` is retained as historical, unverified adapter source only; do not reconnect it without explicit owner authorization. No free routing or station-data backend is connected yet.

Google Maps may recalculate roads after handoff. It receives destinations, not charging targets. URLs support up to nine intermediate stops on supported clients and three on mobile browsers, with a 2,048-character URL limit. The split fallback preserves continuity. Changed settings disable charging-plan export until recalculation.

## Model assumptions

Nominal battery 60.48 kWh; assumed empty vehicle mass 1,750 kg, not a certified specification. Baseline 23 kWh/100 km at 130 km/h on level roads at 20°C with a 75 kg driver is illustrative. Baseline split is 65% aerodynamic / 30% rolling / 5% auxiliary; payload affects rolling and climbing. Climbing efficiency 88%, descending recovery 60%, conservatively capped at zero net segment consumption. Cold-load effects are approximate. No road-specific speed, battery degradation, telemetry or automatic weather model.

Charging uses an illustrative tapered curve (95/65/43/25 kW below 60/80/90/above 90% SOC), station-power limits, 11 kW AC cap, 92% efficiency and five-minute stop overhead. Not a measured MY25 curve. Optimization uses 5%-point departure-charge increments. Fastest minimizes stop time; cheapest minimizes user-entered tariff cost; balanced values a minute at ₺12. Sample driving time scales with speed; tolls and queues are excluded.

Sample station names were researched in public directories, but fixture distances, elevation, power and prices are illustrative. No guarantee of remaining above 20% in real driving is possible from this model.

## Free-service limits and privacy

OpenFreeMap's public instance currently requires no registration or key and is free. Availability is best-effort without an SLA. Do not add paid services or silently fall back to billed providers. Map/CDN providers receive ordinary network requests. Google receives addresses/stops only when the visitor opens a navigation link. Location and preferences remain in the visitor's browser; no account or application backend is present.

## Verification

17 tests cover energy/reserve/payload, summit constraints, charging caps, network exclusions, ordered export, mobile waypoint limits and coordinate validation. Browser QA confirmed real map tiles, attribution, A-pin selection and stale-export protection. Real GPS permission and every mobile Google client have not been tested. New-route EV planning remains unfinished.


Latest UI update: removed the Urla demo loader and sample status bar. From/To start empty. The primary action opens Google Maps directions. Unconnected charging-result controls are hidden; the engine and tests remain for continued development. Arbitrary-route EV planning is not implemented.


Address autocomplete update: both From and To now use Photon’s public API (550ms debounce, minimum 3 characters, bounded memory cache, abort and stale-response protection). Results have keyboard/touch selection; selected coordinates drive map pins and Google Maps navigation. No key or billing. Photon is a best-effort public demo with reasonable-use limits; OSM POI coverage differs from Google. No paid fallback. Typing search text sends it to Photon. Road/charging planning remains unconnected.
