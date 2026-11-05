# EV Route

A dependency-free, mobile-friendly first version of a personal BYD Atto 3 route planner.

Start with [HANDOFF.md](HANDOFF.md) for the owner’s zero-charge requirement, known limitations, and a ready-to-paste prompt for Claude Code or Codex. Sending stops to Google Maps via URL is free and requires no API key.

Run locally: `python3 -m http.server 4173 --directory dist`

Run tests: `node --test tests/*.test.mjs`

## Included

- Sample Zekeriyaköy–Urla journey, prominently labelled as illustrative.
- Starting charge, reserve plus buffer, highway cruising speed.
- 1–5 occupants, average occupant weight, luggage, total payload override.
- Network filters, DC-only mode, fastest / cheapest / balanced optimization.
- User-entered tariffs, temperature, wind and baseline consumption.
- Stop exclusion, recalculation, battery chart, Google Maps stop handoff.
- Optional Google Maps JS integration: real route geometry, sampled elevation, charger discovery, rerouting through selected stops and reserve revalidation.
- Preferences in localStorage. Google key only in the active page, not persisted.

## Optional Google adapter — not enabled

The owner requires a zero-charge solution. Do not enable billing or this potentially billed adapter without new explicit authorization. It is retained as unverified optional code only. The adapter would require Maps JavaScript API, Routes API, Places API (New), and Elevation API in a Google Cloud project. Use an HTTP-referrer-restricted browser key limited to the deployed site's origin and those APIs. Enter it in Connect Google Maps. Never use an unrestricted server key here. Route planning issues multiple billed requests. Set project quotas.

Live integration is implemented against the current Google documentation but has NOT been end-to-end verified with a paid API key. API access, billing, domain restrictions and regional charger data may affect it. Failed discovery/elevation/access validation shows an error; it never silently substitutes sample data.

## Model and limits

60.48 kWh nominal battery; 1,750 kg assumed empty vehicle mass (not a certified specification). Baseline 23 kWh/100 km at 130 km/h, 20°C, level road and 75 kg driver is an assumption. Baseline split: 65% aerodynamic, 30% rolling, 5% auxiliary. Payload modifies rolling and gravitational energy. Climbing efficiency 88%; descending recovery 60%, conservatively capped at zero net segment consumption. Cold-load adjustment is approximate. No automatic weather, battery health, road-specific driving-speed model or vehicle telemetry.

Charging uses an illustrative tapered acceptance curve (95/65/43/25 kW at <60/<80/<90/90+% SOC), station-power cap, 11 kW AC cap, 92% charging efficiency and 5 minutes per stop. It is not a measured MY25 charging curve.

Optimization is a forward station graph with 5-percentage-point departure-charge steps. Fastest minimizes modeled stop time; cheapest minimizes user-estimated charging expense; balanced values a minute at ₺12. Driving time is fixed per route (sample time scales with cruising speed; Google's time does not). No toll optimization, queues, reservations, automatic tariffs or live availability.

Sample station names are drawn from earlier public directory research; all kilometer positions, elevation profile, power ratings and tariffs in the fixture are illustrative, not verified road data. Astor has no sample candidate and selecting only Astor yields an explicit infeasible result. AC filtering is supported for live discovery but the sample contains only DC stations.

Live search samples up to 25 areas within 25 km radii and requires identifiable operator names and compatible connector metadata. This may miss chargers. Provisional off-route distances are straight-line estimates; selected stops are then routed by road and elevation is sampled per leg before acceptance. If verification fails, there is no automatic exhaustive alternative search. Google elevation is sampled and cannot certify the reserve between samples. A modeled feasible route is not a real-world guarantee.

## Verification

15 Node tests cover reserve constraints, summit energy, payload override, weight/speed/wind effects, no-stop journeys, network exclusions, charging caps, invalid inputs and objective optimization. Browser checks covered initial rendering, passenger/luggage recalculation, changed destination rejection and the Google connection dialog. Live API calls require a user-provided key and remain unverified.

## Google Maps export
The selected itinerary exports origin, destination and every selected charger in order. Place IDs are included when available. One link supports at most nine intermediate stops and 2,048 characters. Mobile-safe chunks use at most three intermediate waypoints, preserving continuity and never dropping stops. Changed inputs disable export until recalculation. Sample exports are explicitly unverified. The schematic map has been removed; without a Google key the map area presents setup instructions instead of invented geometry.
