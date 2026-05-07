# 0002 - Architecture Overview and Module Boundaries

## Status

Accepted

## Context

The project needs a small but expressive ecology engine, a 3D scene, a sonification layer, static data, and user controls.

## Decision

Use a feature-oriented frontend:

- `src/features/ecology`: deterministic multi-agent simulation logic.
- `src/features/audio`: Web Audio soundscape synthesis.
- `src/features/reef-scene`: Three.js rendering and WebGPU capability detection.
- `src/features/data`: static data loading and DuckDB-WASM query support.
- `src/features/ui`: React components and controls.
- `src/shared`: reusable utilities and types.

The simulation engine stays independent from React and rendering so it can be unit tested.

## Consequences

- Core behavior can be tested without a browser canvas or audio context.
- Rendering and audio subscribe to derived simulation state.
- DuckDB-WASM is isolated behind a lazy service boundary.

## Alternatives Considered

- One large app component: rejected because simulation, audio, and rendering would be hard to test.
- Full ECS framework: rejected as too heavy for v1.

