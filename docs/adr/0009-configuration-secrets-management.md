# 0009 - Configuration and Secrets Management

## Status

Accepted

## Context

Mode A must not ship secrets. Build-time config is limited to public URLs and version metadata.

## Decision

Use Vite public env vars only for non-secret values. Commit `.env.example` with placeholders. Keep GitHub repo URL, PayPal URL, version, and commit visible in the app.

## Consequences

- No secret can be required for the frontend to run.
- `gitleaks` runs in local hooks.
- Version metadata is generated from git during build.

## Alternatives Considered

- Runtime config endpoint: rejected by ADR 0001.

