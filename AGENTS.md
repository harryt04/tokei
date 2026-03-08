# AGENTS.md — Tokei Codebase Guide

This file is intended for agentic coding agents working in this repository.

## Project Overview

Tokei is a **Next.js 16 / TypeScript** web application using the App Router. It is a routine/timer management tool. Key infrastructure:

- **Auth**: Clerk (`@clerk/nextjs`)
- **Database**: MongoDB (singleton client via `lib/mongo-client.ts`)
- **UI**: shadcn/ui (Radix primitives) + Tailwind CSS
- **Analytics**: PostHog
- **Forms**: react-hook-form + Zod

---

## Commands

### Development

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run start      # Serve production build
```

### Linting & Formatting

```bash
npm run lint       # ESLint via next lint
npm run prettify   # Prettier (writes in place)
```

ESLint is intentionally skipped during builds (`ignoreDuringBuilds: true` moved to
`eslint.config.js`). Run lint separately before committing.

### No Test Suite

There is currently no test framework configured. No Jest, Vitest, or Playwright.
Do not create test files unless the user explicitly requests adding a test framework.

### Utilities

```bash
npm run create-indexes   # Create MongoDB indexes (via Gulp)
```

---

## Project Structure

```
app/              # Next.js App Router: pages, layouts, API routes
  api/            # Route handlers (GET/POST/DELETE)
components/
  custom/         # Application-specific components
  ui/             # shadcn/ui primitives (do not hand-edit)
hooks/            # Custom React hooks (all state management lives here)
lib/              # Shared utilities and server-side singletons
models/           # TypeScript types for domain entities
providers/        # React context providers (theme, PostHog)
actions/          # Next.js Server Actions
public/           # Static assets
```

---

## Code Style

### Formatter: Prettier

Settings (`prettier.config.js`):

- **No semicolons** (`semi: false`)
- **Single quotes** (`singleQuote: true`)
- **Trailing commas** everywhere (`trailingComma: 'all'`)
- Tailwind classes auto-sorted via `prettier-plugin-tailwindcss`

Always run `npm run prettify` after making changes to `.ts`/`.tsx` files.

### TypeScript

- `strict: true` is set but `noImplicitAny: false` — `any` is permitted and used freely
- `strictNullChecks: true` — null/undefined must be handled
- Path alias `@/` resolves to the repo root (e.g., `@/lib/utils`, `@/models`)
- Use plain `type` aliases for all domain types — no classes, no Zod schemas in `models/`
- Inline prop types are preferred: `({ routine }: { routine: Routine })`

### ESLint

Config in `.eslintrc.js`. Notably disabled rules:

- `@typescript-eslint/no-explicit-any` — `any` is allowed
- `@typescript-eslint/no-unused-vars` — unused vars are allowed
- `react-hooks/exhaustive-deps` — hook deps are not enforced
- `react/prop-types`, `react/react-in-jsx-scope` — disabled

---

## Naming Conventions

| Thing               | Convention                | Example                                  |
| ------------------- | ------------------------- | ---------------------------------------- |
| React components    | `PascalCase`              | `RoutineComponent`, `AppSidebar`         |
| Hooks               | `camelCase`, `use` prefix | `useRoutineTimer`, `useRoutines`         |
| Functions/utilities | `camelCase`               | `fetchRoutines`, `formatSecondsToHHMMSS` |
| Types / interfaces  | `PascalCase`              | `Routine`, `RoutineStep`, `SyncGroup`    |
| Component files     | `kebab-case.tsx`          | `routine-component.tsx`                  |
| Hook files          | `use-kebab-case.ts`       | `use-routine-timer.ts`                   |
| Constants           | `SCREAMING_SNAKE_CASE`    | `MINS_FROM_MILLI`                        |
| Env variables       | `SCREAMING_SNAKE_CASE`    | `MONGO_CONNECTION_STRING`                |

---

## Import Order

Follow this layered order (unenforced, but consistent throughout the codebase):

```ts
// 1. External packages
import { useState, useCallback } from 'react'
import { auth } from '@clerk/nextjs/server'

// 2. Internal via @/ alias
import { Routine } from '@/models'
import { getMongoClient, mongoDBConfig } from '@/lib/mongo-client'

// 3. Relative imports
import { Button } from './ui/button'
```

---

## Component Patterns

- **Functional components only** — no class components
- Add `'use client'` at the top of any file that uses hooks or browser APIs
- Use `cn()` (from `@/lib/utils`) for conditional Tailwind class merging — wraps `clsx` + `tailwind-merge`
- Compose shadcn/ui primitives (`Card`, `Button`, `Dialog`, etc.) from `components/ui/`; do not edit those files directly
- Use `function` declarations for top-level page/layout components; arrow functions for smaller inline components

---

## State Management

- **No global state manager** (no Redux, Zustand, etc.)
- All state lives in custom hooks in `hooks/`
- Each hook exposes: data state, `loading`, `error`, and stable `useCallback`-memoized handlers
- Use `useRef` in parallel with `useState` when state is read inside `setInterval` or other closures (prevents stale closures)
- Error type pattern: `catch (err: any) { setError(err.message || 'Fallback message') }`

---

## API Route Patterns

All routes live in `app/api/` and follow this structure:

```ts
export async function GET(req: NextRequest) {
  const user = await auth() // Auth check first

  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const collection = db.collection(mongoDBConfig.collections.routines)
    // ... query ...
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
```

Standard HTTP status codes: 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error).

---

## Error Handling

- **API routes**: `try/catch` → return `NextResponse.json({ error: '...' }, { status: N })`
- **Hooks**: `catch (err: any)` → set error state + rethrow
- **Client fetch** (`lib/api.ts`): throw on non-ok response — `throw new Error(\`Error: ${response.status}\`)`
- **Fire-and-forget**: `.catch(() => { /* Ignore */ })` is used intentionally for non-critical calls (e.g., analytics)

---

## Environment & Database

- Environment variables are in `.env.local` (see `.env.sample` for required keys)
- MongoDB database name is environment-aware: `tokei-${process.env.NODE_ENV}` (e.g., `tokei-development`, `tokei-production`)
- Always access MongoDB through the singleton: `getMongoClient()` from `@/lib/mongo-client`
- Collection and DB names are centralized in `mongoDBConfig` — never hardcode them

---

## Key Files Reference

| File                         | Purpose                                   |
| ---------------------------- | ----------------------------------------- |
| `models/routine.ts`          | Core domain types                         |
| `lib/mongo-client.ts`        | MongoDB singleton + config                |
| `lib/utils.ts`               | `cn()`, time formatters, shared helpers   |
| `lib/api.ts`                 | Client-side fetch wrappers for API routes |
| `hooks/use-routine-timer.ts` | Main timer logic (829 lines)              |
| `hooks/use-routines.ts`      | CRUD state for routines                   |
| `proxy.ts`                   | Clerk auth proxy (Next.js 16 convention)  |
| `app/api/routine/route.ts`   | Single-routine CRUD API                   |
| `app/api/routines/route.ts`  | List all routines API                     |
