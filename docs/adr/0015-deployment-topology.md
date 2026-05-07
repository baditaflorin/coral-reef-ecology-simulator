# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode A means GitHub Pages is the only deployment target.

## Decision

Deploy only static files from `docs/` on GitHub Pages.

## Consequences

- No Docker Compose, nginx, Prometheus, backend health checks, or server runbook are required.
- `docs/deploy.md` documents publishing, rollback, and custom domain notes.

## Alternatives Considered

- Pages frontend plus Docker backend: rejected by ADR 0001.

