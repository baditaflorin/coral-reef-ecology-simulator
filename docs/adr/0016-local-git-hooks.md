# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project uses local hooks instead of GitHub Actions.

## Decision

Use a plain `.githooks/` directory wired through `make install-hooks`.

Hooks:

- `pre-commit`: gitleaks, prettier check, ESLint, TypeScript.
- `commit-msg`: Conventional Commits validation.
- `pre-push`: tests, build, smoke.
- `post-merge` and `post-checkout`: install dependencies when lockfile changes are detected.

## Consequences

- Contributors can run hook checks manually through Makefile targets.
- Hooks stay inspectable without another dependency.

## Alternatives Considered

- Lefthook: good option, but plain hooks are enough for v1.
