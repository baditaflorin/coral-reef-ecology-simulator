# Postmortem

## What Was Built

Built v0.1.0 of Coral Reef Ecology Simulator as a static GitHub Pages app. The v1 includes:

- A TypeScript multi-agent ecology engine with coral, algae, herbivore, grazer, planktivore, and predator agents.
- Temperature and pH controls that alter suitability, bleaching pressure, acidification pressure, grazing, and algae competition.
- Scenario presets for balanced reef, marine heatwave, acidification pulse, overfishing, and restoration.
- Three.js animated reef scene with WebGPU capability probing and WebGL fallback.
- Web Audio soundscape whose hum, fish pulse, algae drone, stress drone, and reef crackle respond to simulation metrics.
- DuckDB-WASM lazy-loaded query panel for local simulation log summaries.
- Static species data contract in `/data/v1/`.
- GitHub Pages publishing from `main` branch `/docs`.
- Local hooks, Makefile targets, unit tests, and Playwright smoke coverage.

## Was Mode A Correct?

Yes. Mode A was the correct choice in hindsight. No runtime backend was needed for v1 because the simulation, visualization, audio, data loading, local storage, and DuckDB log analysis all work in the browser. Mode B may become useful later if the project adds large empirical reef datasets. Mode C is still not justified.

## What Worked

- Keeping the simulation engine pure TypeScript made it quick to test trophic cascade behavior.
- Lazy-loading Three.js and DuckDB-WASM kept the first-load JavaScript budget under 200 KB gzipped.
- Publishing from `/docs` worked well once the local smoke server mirrored the GitHub Pages base path.
- Web Audio made the climate stress changes feel much more immediate than metrics alone.

## What Did Not Work

- A generic static server initially failed to mirror the project Pages base path, so the smoke script needed a tiny custom server.
- The first algae-cascade test waited too long and both scenarios hit maximum algae cover; the test now checks the earlier cascade window.
- DuckDB-WASM is useful, but it remains an optional advanced panel because it is too heavy for initial load.

## What Surprised Us

The strongest educational effect came from combining modest visual changes with soundscape changes. The audio layer makes biodiversity loss feel legible without needing photorealism.

## Accepted Tech Debt

- The ecology model is educational and qualitative, not calibrated against field data.
- WebGPU is currently a capability probe and future acceleration path; Three.js WebGL does the v1 rendering.
- The service worker uses simple runtime caching rather than a generated precache manifest.
- Saved state is limited to local settings, not full scenario histories.

## Next Three Improvements

1. Add a guided lesson mode that explains each cascade as it happens.
2. Add optional Mode B empirical datasets for real reef temperature, pH, and species baselines.
3. Add richer spatial dynamics with reef patches, larval recruitment, and localized bleaching.

## Time Spent vs Estimate

Estimated: 2 to 3 focused hours for a functional v1 scaffold and simulator.

Actual: About 2 focused hours for implementation, checks, local smoke, Pages setup, and documentation. The scope fit Mode A well.
