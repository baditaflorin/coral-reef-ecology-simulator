# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The public site must work from day one and remain static.

## Decision

Publish GitHub Pages from the `main` branch `/docs` directory at https://baditaflorin.github.io/coral-reef-ecology-simulator/.

Vite builds directly into `docs/`. The `.gitignore` excludes `dist/` but intentionally does not exclude `docs/`, because `docs/` is the Pages artifact.

## Consequences

- Each production build updates committed static files.
- Rollback is a git revert of the publishing commit.
- The Vite base path must remain `/coral-reef-ecology-simulator/`.
- SPA fallback is handled by copying `docs/index.html` to `docs/404.html`.

## Alternatives Considered

- `gh-pages` branch: rejected to keep all artifacts visible on `main`.
- GitHub Actions deployment: rejected by project constraint.

