# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A allows static assets only. Species traits and presets are small enough to commit.

## Decision

Store v1 data under `public/data/v1/`:

- `species.json`: species catalog.
- `species.meta.json`: schema version, generation time, and source commit.

The frontend fetches these files with a versioned cache key. Breaking schema changes create `/data/v2/`.

## Consequences

- Data is served by GitHub Pages and works offline after service worker caching.
- No runtime database is required.
- Deterministic ordering keeps diffs readable.

## Alternatives Considered

- DuckDB/Parquet artifacts: rejected for the small v1 catalog.
- Runtime API: rejected by ADR 0001.
