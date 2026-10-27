# Contributing to Tokei

Thank you for your interest in contributing!

## Pull Requests

All PRs must pass `pnpm run ci` before merge.

- `prettier --check .`
- `pnpm run lint`
- `pnpm exec tsc --noEmit`
- Unit tests via Jest (`CI=true pnpm run test --watchAll=false`)

See AGENTS.md for more details on the PR gate.

## Setup

```bash
pnpm install
pnpm run ci
```
