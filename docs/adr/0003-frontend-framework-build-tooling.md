# 0003 - Frontend Framework and Build Tooling

## Status

Accepted

## Context

The app needs strict TypeScript, fast local iteration, GitHub Pages output, and a maintainable interactive UI.

## Decision

Use React, TypeScript strict mode, Vite, Tailwind CSS, Vitest, and Playwright.

## Consequences

- The Vite `base` is `/coral-reef-ecology-simulator/`.
- Production builds write to `docs/` for GitHub Pages.
- React is used for controls and state orchestration, while Three.js owns its canvas.

## Alternatives Considered

- SvelteKit: good fit, but React has wider library compatibility here.
- Vanilla TypeScript: viable, but would slow down UI state work.

