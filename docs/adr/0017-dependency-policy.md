# 0017 - Dependency Policy

## Status

Accepted

## Context

The simulator should use proven libraries and keep the initial payload lean.

## Decision

Use production-ready dependencies only:

- Vite, React, TypeScript, Tailwind CSS.
- Three.js for rendering.
- Web Audio through browser APIs.
- TanStack Query for static data fetching and caching.
- Zod for static data validation.
- DuckDB-WASM lazy-loaded for local log queries.
- Vitest and Playwright for testing.

## Consequences

- New dependencies require a clear need.
- Heavy modules must be lazy-loaded or kept out of the critical path.

## Alternatives Considered

- Custom renderer or SQL engine: rejected because mature libraries exist.

