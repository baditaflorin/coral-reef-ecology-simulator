# 0013 - Testing Strategy

## Status

Accepted

## Context

The simulation has real logic, and the Pages build must stay deployable.

## Decision

Use Vitest for unit tests, Playwright for one happy-path smoke test, and `scripts/smoke.sh` to build, serve `docs/`, and run the smoke test.

## Consequences

- `make test` covers simulation modules.
- `make smoke` verifies the static Pages artifact.
- Browser APIs like Web Audio and WebGPU are feature-detected to avoid flaky tests.

## Alternatives Considered

- Manual-only testing: rejected because trophic logic can regress silently.
