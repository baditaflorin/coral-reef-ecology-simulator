# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode B is not used. There is no scheduled or offline data generation requirement in v1.

## Decision

Do not add a Go or Python data pipeline. Maintain the small species catalog as versioned static JSON.

## Consequences

- `make data` validates and copies static data rather than scraping or transforming external sources.
- There are no generated artifacts hosted on GitHub Releases in v1.

## Alternatives Considered

- A Mode B generator: rejected until the project needs large empirical datasets.

