# 0001 - Deployment Mode

## Status

Accepted

## Context

The simulator needs interactive visuals, audio, local controls, and static educational data. It does not need accounts, cross-device sync, secrets, private APIs, shared state, or server-side writes in v1.

## Decision

Use Mode A: Pure GitHub Pages.

The app is a static Vite build published from `main` branch `/docs`. Simulation runs in TypeScript in the browser. Three.js renders the reef, WebGPU is used only when available for capability-aware acceleration paths, Web Audio creates the soundscape, DuckDB-WASM is lazy-loaded for local simulation log queries, and browser storage keeps user state.

## Consequences

- There is no runtime backend, Docker image, nginx config, server database, or server-side metrics in v1.
- All public functionality works from GitHub Pages over HTTPS.
- Features that require secrets, shared persistence, or authenticated writes are out of scope.
- Heavy WASM dependencies must be lazy-loaded to protect initial load size.

## Alternatives Considered

- Mode B: Rejected for v1 because all species data is small and static.
- Mode C: Rejected because no runtime API is required.

