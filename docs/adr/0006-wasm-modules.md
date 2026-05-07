# 0006 - WASM Modules

## Status

Accepted

## Context

DuckDB-WASM is useful for local exploratory queries over simulation logs, but it is too heavy for initial load. GitHub Pages cannot set custom COOP/COEP headers.

## Decision

Lazy-load DuckDB-WASM only after the user opens the data query panel. Avoid threaded WASM features that require cross-origin isolation. The core simulator does not depend on WASM.

## Consequences

- Initial load remains focused on the interactive simulator.
- Query features gracefully report failure if WASM initialization is unavailable.
- No service worker header shim is required for v1.

## Alternatives Considered

- Always loading DuckDB-WASM: rejected due to payload cost.
- Python/librosa in browser: rejected. v1 uses procedural Web Audio; offline audio analysis can be considered later.

