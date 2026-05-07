# 0012 - Metrics and Observability

## Status

Accepted

## Context

Mode A has no server metrics endpoint. Privacy is important for an educational static site.

## Decision

Do not add analytics in v1. Observability is limited to local browser errors, smoke tests, and user feedback through GitHub issues.

## Consequences

- No PII or usage telemetry is collected.
- Product decisions rely on GitHub feedback rather than analytics.

## Alternatives Considered

- Plausible analytics: reasonable later, but unnecessary for v1.
