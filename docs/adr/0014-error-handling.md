# 0014 - Error Handling Conventions

## Status

Accepted

## Context

The app must degrade when WebGPU, audio, storage, or DuckDB-WASM are unavailable.

## Decision

Use typed result objects for expected failures, React error boundaries for unexpected UI failures, and visible toasts for recoverable issues.

## Consequences

- Optional advanced features fail softly.
- The main simulation remains usable without WebGPU or DuckDB-WASM.

## Alternatives Considered

- Throwing through UI code: rejected because it creates avoidable blank screens.

