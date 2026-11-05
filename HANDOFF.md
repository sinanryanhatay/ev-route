# EV Route: handoff for Claude Code or Codex

## User objective and constraints
Build a publicly accessible, mobile-friendly EV trip planner for Turkey. Vehicle: 2025 BYD Atto 3, nominal 60.48 kWh. Networks: ZES, Lumicle, Astor, WAT and Trugo. Inputs: start/destination, current battery, minimum 20% reserve plus buffer, 130/140 km/h cruising preference, occupants and luggage or total payload. Compare fastest, cheapest and balanced charging stops. Export ALL selected stops in order to Google Maps.

IMPORTANT: The owner does NOT want to be charged. Do not provision paid services, enable billing, add paid Google API calls or require a paid API key without new explicit authorization. Google Maps URL handoff needs no API key and is the intended free navigation path. The historical Google adapter is no longer imported by the app and has NOT been connected or end-to-end tested. It uses potentially billed APIs and must remain opt-in/disconnected. A dynamic Google route inside the app is not supplied by the free URL handoff. Do not recreate a fictional map or claim that sample routes are live.

## Current update: OpenFreeMap is implemented

The active app now uses MapLibre GL JS 5.12.0 (pinned unpkg CDN) and OpenFreeMap Liberty tiles. No Google SDK, paid API or API-key prompt is loaded. `dist/free-map.mjs` handles map loading, attribution, coordinate validation, A/B pins and map-point selection. Current-location is beside From with permission/error feedback. Google Maps remains external URL navigation. There are 17 tests, including coordinate bounds.

The actual map is NOT a live EV-routing engine. No free geocoding/road routing/elevation/station backend is connected. Typed addresses are handed off to Google Maps; map-picked coordinates produce pins. Sample stations lack verified coordinates, so they are not plotted, and no fake road line is drawn. The map remains usable even when no sample charging plan is feasible.

## Current implementation
Vanilla HTML/CSS/ES modules in dist/. No framework, build step or npm dependencies. Static hosting works. README documents the model assumptions. Tests run on Node's standard test runner.

- dist/index.html: forms, results, Google setup and route-export dialogs.
- dist/app.mjs: UI, saved preferences, rendering, planning orchestration.
- dist/engine.mjs: simplified energy/charging model and dynamic-programming planner.
- dist/export.mjs: Google Maps URL generation, ordered stops and mobile-safe splitting.
- dist/google.mjs: optional Google Maps JS, Routes, Places and Elevation adapter; unverified with credentials.
- tests/: 17 model/export/map-coordinate tests.

Run: python3 -m http.server 4173 --directory dist
Test: node --test tests/*.test.mjs

The existing public demo is https://atto-route-sinan.srh34.chatgpt.site . This repository is portable; the original owner's Sites identity and source-repository credentials are intentionally excluded. GitHub edits do NOT automatically deploy to that Sites instance. You can deploy dist/ on a free static host or configure GitHub Pages separately, subject to current account eligibility. Do not assume deployment or billing has been configured.

## What actually works
Sample trip calculation, passenger/luggage/override effects, reserve constraints, network filtering, changing priorities, excluding stops, battery chart, persisted browser preferences, all-stop Google Maps export, and mobile-safe split links. Input changes disable export until recalculation.

## What does NOT yet work as a verified live service
- No free live route/elevation/station backend is connected.
- The sample's distance, terrain, power and tariffs are illustrative. Names come from directory research but exact entrances and motorway direction are not verified.
- No live operator prices, occupancy or queue predictions; tariffs are user assumptions.
- No actual vehicle telemetry, battery degradation input, road-segment speed or automatic weather model.
- No automatic backup selection if Google route verification fails.
- Google model is conservative and simplified; do not promise never falling below 20%.
- The schematic map was removed at the owner's request. The map now displays actual OpenFreeMap geography; unverified sample charger points and road paths are not drawn.

## Suggested next work, respecting zero-charge constraint
1. Agree on a genuinely free map/routing/data strategy. Consider open-source mapping with correct attribution and tile-provider usage limits. Public demo endpoints are not unlimited production infrastructure. Do not bypass Google API requirements using undocumented endpoints or scraping.
2. Integrate real road geometry, road-access checks for stations, elevation sampling, and reliable licensed Turkish station data. Clearly distinguish missing data from available chargers.
3. Calibrate empty vehicle mass, usable battery capacity, consumption at speed, weather effects and charging curve against verified MY25 data / user measurements.
4. Ensure the same route and stop sequence drives the display, optimizer, battery profile and Google export. Google may choose different roads after handoff.
5. Test at mobile sizes and test export on Android/iOS. Google URL limits are up to 3 intermediate waypoints on mobile browsers and up to 9 elsewhere, with a 2,048-character URL cap. Split links preserve every stop.
6. Retain transparent sample labeling, no-feasible-plan errors and stale-plan export protection.

## Ready-to-paste prompt
Read README.md, HANDOFF.md and AGENTS.md, inspect the code, and run the tests. Continue EV Route from this implementation. The owner requires a zero-charge approach: do not enable billed Google APIs or provision paid resources. First identify a feasible free map and routing approach and explain its data/usage limits. Replace illustrative route data only when real data is available; preserve all-stop Google Maps export, battery reserve checks, passenger/luggage inputs, and clear uncertainty. Do not claim the current sample is a verified driving itinerary. Keep the original owner's deployment untouched unless explicitly authorized.

## Sharing with the brother
The repository remains in the owner's account. The brother can fork it to his GitHub account, clone his fork, and open the folder in Claude Code or Codex. Chat subscriptions and chat histories are not transferred with a repository. The source and these handoff notes provide the context. No ownership transfer is required.


Latest UI update: removed the Urla demo loader and sample status bar. From/To start empty. The primary action opens Google Maps directions. Unconnected charging-result controls are hidden; the engine and tests remain for continued development. Arbitrary-route EV planning is not implemented.
