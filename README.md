# Tokei 時計

Tokei (時計, meaning 'clock' in Japanese) is a free, open-source timer app built for power users. Designed specifically for chefs in the kitchen, it helps manage multiple timers simultaneously, ensuring all dishes are finished at the perfect moment.

Built with:

- Next.js
- TypeScript
- Tailwind CSS
- PostHog
- Better Auth
- shadcn UI

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute and the PR requirements (`pnpm run ci`).

# Creating indexes for your own mongodb instance

1. Supply your `defaultConnectionString` in `lib/mongo-client.ts`
1. Run `pnpm run create-indexes` at the repo root to create indexes for the collections in your mongodb instance.
   - Gulp is a local development dependency; run `pnpm install --frozen-lockfile` if it is missing.

## Package manager

Use pnpm 11.24.0, pinned in `package.json`. Install it with
`npm install --global pnpm@11.24.0` if pnpm is not available.
Run `pnpm install --frozen-lockfile` after cloning. Commit `pnpm-lock.yaml`
when dependencies change; do not generate npm or Yarn lockfiles.

## Node.js runtime

Use Node.js 24 for local development, validation, and deployment.
The runtime is declared in `package.json` and `.nvmrc`.
