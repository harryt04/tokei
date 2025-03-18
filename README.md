# Tokei 時計

Tokei (時計, "clock" in Japanese) is a free and open source timer app for power users. It's designed for chefs in the kitchen, fitness instructors, and project managers who need precise, sequential routines to keep everything on track.

Built with:

- Next.js
- TypeScript
- Tailwind CSS
- PostHog
- Clerk
- shadcn UI

# Creating indexes for your own mongodb instance

1. Supply your `defaultConnectionString` in `lib/mongo-client.ts`
1. Run `npm run create-indexes` at the repo root to create indexes for the collections in your mongodb instance.
   - If you get an error about gulp not being found, run `npm install -g gulp` to install gulp globally, then try again.
