# Anteiku Production Architecture

## Principles

- Postgres is the source of truth for tenancy, authorization, money, and waste data.
- Supabase Auth owns identity; application tables reference `auth.users`.
- Row Level Security is mandatory on every table exposed through the Supabase API.
- Global catalog data is read-only to customers. A cafe's menu, price, availability, and overrides are stored in `business_products`.
- Money is stored in integer minor units (`129` means EUR 1.29), with an ISO 4217 currency.
- Route handlers and server actions call application use cases. UI code does not contain database queries.
- Service/secret keys are restricted to trusted import and administrative jobs.

## Runtime Boundaries

```text
UI (Server/Client Components)
        |
Route handlers / Server actions
        |
Application use cases + validation
        |
Repository interfaces
        |
Supabase repository implementations
        |
Postgres + Auth + Storage
```

The initial code keeps these layers lightweight:

- `src/modules/*/domain`: domain types and invariants.
- `src/modules/*/application`: use cases and repository contracts.
- `src/modules/*/infrastructure`: Supabase implementations.
- `src/lib/supabase`: browser/server/session clients.
- `app/api`: HTTP adapters.

## Multi-tenancy

Users belong to businesses through `business_memberships`. All tenant-owned rows carry `business_id`.
RLS checks membership through non-recursive `security definer` helper functions. Owners and admins may
manage the menu; all active members may log and view waste.

An account can belong to multiple businesses. The first release uses the oldest active membership as the
active business. A persisted business switcher can be added without changing the database model.

## Product Catalog

The catalog has two layers:

1. `catalog_products`: canonical European cafe, bakery, ingredient, and packaged-food templates.
2. `catalog_product_aliases`: localized names, common spellings, and transliterations.

Search is performed in Postgres with prefix matching plus `pg_trgm` similarity. Results return a canonical
name, image, unit, origin countries, and category. Selecting a result creates a `business_products` row with
the cafe's own name and unit cost.

### Catalog ingestion

- Curated templates ship in `src/data/european-food-catalog.ts` (bundled, no DB seed required).
- `supabase/seed.sql` remains optional for teams that prefer a database-backed catalog.
- Generic product images should be licensed, resized to WebP, and stored in the public
  `catalog-images` Supabase Storage bucket.
- A scheduled trusted importer can enrich packaged products from Open Food Facts. Imported records retain
  source attribution and external IDs, are normalized, deduplicated, and never write directly to customer menus.
- Search does not call third-party APIs in the request path. Imports happen asynchronously so typing remains fast
  and reliable.

## Auth Flow

- Email/password sign-up and sign-in use the Supabase browser client.
- `/auth/callback` exchanges email confirmation/OAuth codes for cookie-backed sessions.
- `middleware.ts` refreshes sessions.
- Protected server pages validate claims and redirect anonymous users.
- The first authenticated visit without a membership redirects to `/onboarding`.
- Onboarding calls `create_business_with_owner`, which creates the business, first location, and owner membership
  atomically.

## Next Slices

1. Product setup and pricing.
2. Daily waste logging with cost snapshots.
3. Dashboard aggregations and exports.
4. Recommendation generation with explainable financial impact.
5. Supplier invoice ingestion and product matching.
6. Stripe subscription lifecycle and entitlement checks.
