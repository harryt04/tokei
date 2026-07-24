# Contributing to Tokei

Thank you for your interest in contributing!

## Pull Requests

All PRs must pass `npm run ci` before merge.

- `prettier --check .`
- `npm run lint`
- `npx tsc --noEmit`
- Unit tests via Jest (`CI=true npm test -- --watchAll=false`)

See AGENTS.md for more details on the PR gate.

## Setup

```bash
npm install
npm run ci
```
