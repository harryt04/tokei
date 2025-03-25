# Tokei 時計

Tokei (時計, meaning 'clock' in Japanese) is a free, open-source timer app built for power users. Designed specifically for chefs in the kitchen, it helps manage multiple timers simultaneously, ensuring all dishes are finished at the perfect moment.

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
