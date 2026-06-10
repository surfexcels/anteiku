# Anteiku

Profit-leakage monitoring for independent cafes and bakeries.

## Stack

- Next.js 15 and React 19
- Supabase Auth, Postgres, Row Level Security, and Storage
- TypeScript and Zod

The production architecture is documented in [`docs/architecture.md`](docs/architecture.md).

## Local setup

1. Create a Supabase project or start the Supabase CLI locally.
2. Copy `.env.example` to `.env.local` and add the project URL and publishable key.
3. Apply the migration and seed data.
4. Start the app.

```powershell
supabase db reset
npm install
npm run dev
```

Only the initial migration is required. `supabase/seed.sql` is optional — the
European product catalog ships in the app (`src/data/european-food-catalog.ts`).

For a hosted project, link the CLI and push migrations:

```powershell
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Add `http://localhost:3000/auth/callback` and the production equivalent to the
Supabase Auth redirect allow list.

## Verification

```powershell
npm run typecheck
npm run build
supabase db lint
```

The Docker daemon must be running for `supabase db reset`. The first migration
creates the full tenant schema, RLS policies, indexed catalog search, and
business onboarding RPC. `supabase/seed.sql` loads the starter European catalog.
