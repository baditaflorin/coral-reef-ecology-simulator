# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

The bootstrap specification defines Go layout requirements for Modes B and C.

## Decision

Skip Go backend directories in Mode A. There is no `cmd/`, `internal/`, `pkg/`, `api/`, `configs/`, or `deploy/` backend layout.

## Consequences

- The repository stays frontend-only.
- Go-specific hooks are documented as not applicable for v1.

## Alternatives Considered

- Empty Go skeleton: rejected because it would imply a backend that does not exist.
