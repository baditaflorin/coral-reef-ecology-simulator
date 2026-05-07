# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

Users need local continuity for sliders, scenario presets, sound preference, and simulation snapshots.

## Decision

Use `localStorage` for compact preferences and simulation state. Avoid IndexedDB/OPFS until saved histories become large.

## Consequences

- Saves are device-local and private.
- No account or sync UX is needed.
- Storage failures degrade to in-memory defaults.

## Alternatives Considered

- IndexedDB: more complexity than v1 needs.
- Server persistence: rejected by ADR 0001.
