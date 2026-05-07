# 0011 - Logging Strategy

## Status

Accepted

## Context

There is no server. Browser logs should support debugging without polluting production.

## Decision

Use minimal browser logging. Production code avoids routine `console.log`; errors are surfaced through UI toasts and error boundaries.

## Consequences

- Users see recoverable errors in the app.
- No telemetry is collected by default.

## Alternatives Considered

- Remote log collection: rejected because it adds privacy and infrastructure cost.
