# HASTECH Commerce

A multi-tenant commerce platform: any small business, service provider or creator can
create an account, set up a storefront, publish products, accept payments via Paystack,
and see real orders and analytics — without anyone touching the codebase per seller.

The first real seller is a Ghanaian bookshop ("Amara Books", selling books and
graduation sashes), but nothing in the schema or UI is bookshop-specific. A clothing
brand, a barber, a caterer or a consultant can sign up and use the exact same tables,
routes and dashboard.

## Architecture

**Stack:** Next.js 16 (App Router, Server Components, Server Actions, Turbopack) +
TypeScript + Tailwind CSS v4, on Supabase (Postgres, Auth, Storage), with Paystack for
payments. Deploys to Vercel + Supabase — no servers to manage.

```
Browser
  │
  ├─ Public storefront   /store/[slug]/...        (RLS-governed, public + authenticated)
  ├─ Seller dashboard     /dashboard/[slug]/...     (RLS-governed, store members only)
  └─ Platform auth        /login /signup /onboarding
        │
        ▼
Next.js Server (Server Components / Server Actions / Route Handlers)
        │
        ├─ Supabase client bound to the signed-in user's session (RLS enforced)
        ├─ Supabase service-role client — ONLY for: guest checkout writes,
        │   payment credentials, the Paystack webhook (see "Security model" below)
        └─ Paystack REST API (server-side only; secret keys never reach the browser)
        │
        ▼
Postgres (Supabase) — every tenant-owned table carries store_id and is
protected by Row Level Security. See supabase/migrations/.
```

### Multi-tenancy & security model

This is the part of the spec marked "extremely important," so it gets its own section.

- Every tenant-owned table (`products`, `orders`, `customers`, `payments`,
  `analytics_events`, …) has a `store_id` column and Row Level Security **enabled**.
  RLS is the actual boundary — the app also filters by `store_id` for convenience, but
  every query is safe even if that filter were dropped.
- Two SECURITY DEFINER helper functions, `is_store_member(store_id)` and
  `is_store_owner(store_id)`, gate almost every policy. They're defined once
  (`0009_functions_triggers.sql`) to avoid recursive-RLS bugs and duplicated logic.
- Tables that must never be touched by a browser-facing role at all —
  `store_payment_credentials` (Paystack secret keys), `payments`, `payment_events`,
  `carts`/`cart_items`, `store_order_counters` — have RLS enabled with **zero**
  policies for `anon`/`authenticated`. Only the service-role key (used exclusively in
  trusted server code, see `src/lib/supabase/admin.ts`) can reach them. This is a hard
  default-deny, not an oversight.
- Analytics writes (`product_views`, `analytics_events`) never happen via a direct
  table INSERT from the browser — they go through two SECURITY DEFINER RPCs,
  `record_product_view` and `record_analytics_event`, which validate the
  product/store relationship server-side before writing. This stops one store from
  forging another store's analytics.
- Guest checkout works by design (spec requirement) without needing `auth.uid()`, so
  cart mutations go through Server Actions using the service-role client, gated by an
  unguessable cart id in an httpOnly cookie — see `src/lib/cart.ts` for the reasoning.
- **This is tested, not just asserted.** `npm run db:test-rls` spins up a scratch
  local Postgres database, applies the real migrations, and runs
  `scripts/rls_isolation_tests.sql`, which creates two competing sellers and proves
  seller A cannot read or write seller B's products, orders, customers, or payment
  credentials — and that an unpublished store disappears from the public catalogue
  even while otherwise "active." See "Testing" below.

### Payments (Paystack)

- **Multi-tenant by design:** there is no platform-wide `PAYSTACK_SECRET_KEY` env
  var. Each seller connects their *own* Paystack account from
  Dashboard → Settings → Payments, so payments go directly to them. Keys live in
  `store_payment_credentials`, reachable only by the service-role client.
- `POST /store/[slug]/checkout` re-computes the order total **server-side** from the
  cart stored in the database (`src/lib/orders.ts`, `src/lib/money.ts`) — the
  checkout form's own numbers are never trusted — then calls
  `initializeOrderPayment` (`src/lib/payments/process.ts`), which creates a `payments`
  row and starts a Paystack Standard (hosted, redirect-based) transaction for that
  authoritative amount.
- **Verification is authoritative, not the browser redirect.** Both the checkout
  success page and the Paystack webhook (`/api/webhooks/paystack`) call the same
  `verifyAndProcessPayment`, which re-fetches the transaction from Paystack's
  `/transaction/verify` endpoint and checks the amount/currency against what we
  stored — never trusting the webhook payload or the redirect query string alone.
- **Idempotent by construction:** a unique constraint on
  `payment_events(provider, reference, event_type)` means whichever of
  {webhook, success page} arrives first "wins" and the other is a safe no-op, not a
  double-fulfilment.
- **Webhook signature verification is per-store:** each store has its own Paystack
  secret, so the handler reads `metadata.store_id` from the (untrusted) body, looks up
  *that* store's secret, and verifies the HMAC-SHA512 signature against it before
  trusting anything else in the payload.

### Storefront vs. dashboard

Both share the same design tokens (`src/app/globals.css`) but the storefront takes on
each seller's own accent colour (`stores.theme.accentColor`, set from
Dashboard → Settings → Branding) so it feels like the seller's brand, not HASTECH's —
the platform name only appears as a subtle "Powered by" credit in the storefront footer.
A seller with no logo uploaded gets a plain circular avatar in their own accent colour
showing their store's initial (`src/components/storefront/store-header.tsx`), rather than
a generic placeholder image.

### Feedback

Dashboard → Feedback lets a signed-in seller report a bug, request a feature, or ask a
question — written to `platform_feedback` (see below), visible only to that seller and to
platform admins (`is_platform_admin()`). This is feedback *about the platform*, sent to
the HASTECH team; it is not a customer-support inbox for a store's own shoppers.

## Database

See `supabase/migrations/0001`–`0015` for the full, commented schema (`0012` is a
hardening pass applied after running Supabase's security/performance advisors against
the live project: pinned `search_path` on three functions, narrowed `EXECUTE` grants
on trigger-only functions and RLS helpers to just the roles that need them, wrapped
`auth.uid()` calls in RLS policies as `(select auth.uid())` so they evaluate once per
query instead of once per row, added missing foreign-key-covering indexes, and merged
5 tables' duplicate public/member SELECT policies into one). Summary of the
core entities:

- **Tenancy:** `profiles`, `stores`, `store_members`, `store_settings`,
  `store_payment_credentials`, `platform_admins`
- **Catalogue:** `categories`, `products`, `product_images`, `product_variants`,
  `inventory_movements` (the audit ledger behind `products.stock_quantity`)
- **Commerce:** `customers`, `customer_addresses`, `carts`, `cart_items`, `orders`,
  `order_items`
- **Payments:** `payments`, `payment_events` (idempotency log)
- **Analytics:** `analytics_events` (generic event stream), `product_views`
  (deduplicated, privacy-conscious — anonymous `visitor_id`, no PII)
- **Ops:** `notifications`, `audit_logs`, `platform_feedback` (seller bug reports/feature
  requests, scoped to their own submissions plus platform admins)

Deliberate naming: there is no `books` or `sashes` table anywhere. "Products",
"categories" and "product_variants" are generic on purpose so a clothing seller, a
service provider or a digital-goods seller can use the same schema (see
`business_type` on `stores` and `product_type` on `products`).

## Environment setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from
   Project Settings → API.
3. Apply the migrations in order, via any of:
   - the Supabase MCP server's `apply_migration` tool, one file at a time in numeric
     order (this is how the reference deployment was actually applied — no local
     Postgres wire-protocol access needed, works over the Supabase Management API),
   - the Supabase SQL editor, pasting each file in `supabase/migrations/` in numeric
     order,
   - the Supabase CLI: `supabase link` then `supabase db push`, or
   - `psql "$DATABASE_URL" -f supabase/migrations/000N_....sql` for each file.

   After applying, run the Supabase advisors (`get_advisors` via MCP, or Dashboard →
   Advisors) — `0012_security_performance_hardening.sql` exists precisely because that
   check caught real issues (mutable `search_path`, over-broad `EXECUTE` grants,
   per-row `auth.uid()` re-evaluation) that a syntactically-correct migration doesn't
   surface on its own. Re-run it after any future schema change.
4. `npm install`
5. `npm run seed` — seeds one realistic dev store ("Amara Books") with real
   categories and products (see `scripts/seed.ts`). It does **not** seed fake
   orders/payments/analytics — those only appear once you actually use the app,
   by design (spec: never fake data to make something look complete).
   Prints a dev login (`owner@amarabooks.test` / see script output).
6. `npm run dev` and open `http://localhost:3000`.

For Paystack: sign in as the seed owner, go to Dashboard → Settings → Payments, and
paste **test** keys from your Paystack dashboard. To receive webhooks locally, forward
`https://<your-tunnel>/api/webhooks/paystack` with a tool like `ngrok` or the Paystack
CLI, and confirm the checkout flow end-to-end with a Paystack test card.

## Local development

```bash
npm run dev          # Next.js dev server (Turbopack)
npm run lint         # ESLint
npm run test         # Vitest unit tests (pure business logic, no network/DB needed)
npm run db:test-rls  # Tenant-isolation RLS tests against a scratch local Postgres
npm run build         # Production build
```

## Testing

- **Unit tests** (`tests/unit/`, Vitest): order/cart total math (including floating
  point edge cases), delivery fee resolution, slug validation, low-stock/out-of-stock
  logic, and Paystack webhook signature verification (valid signature, wrong secret,
  tampered body, missing header). These need no network or database.
- **Tenant isolation tests** (`scripts/rls_isolation_tests.sql`, run via
  `npm run db:test-rls`): the single most important test in this codebase. It applies
  the real migrations to a throwaway local Postgres, seeds two competing sellers, and
  asserts — as `anon` and as each seller's `authenticated` role — that neither can see
  or mutate the other's products, orders, customers or payment credentials, that
  direct writes to analytics tables are rejected (must go through the RPCs), and that
  an unpublished store's products are invisible to the public regardless of status.
  Requires a local `psql` with superuser access; no Docker or Supabase CLI needed
  (see `scripts/local_test_shim.sql` for the small stand-in for Supabase's
  `auth.uid()`/roles).
- **Not yet covered by automated tests** (see "Known limitations"): end-to-end
  browser flows (signup → publish → checkout → webhook), image upload, and the full
  onboarding wizard. These were exercised manually; see below.

## Authentication setup (manual dashboard steps)

Sign-up supports three paths: a confirmation link, a 6-digit code typed into
`/verify-email`, and "Continue with Google." The code for all three is in this repo, but
each one also needs a one-time setting in a dashboard that no CLI/MCP tool can reach —
these have to be done by hand, once, per Supabase project:

1. **Fix the confirmation link's destination (required — this is the localhost:3000 bug).**
   Supabase Dashboard → your project → Authentication → URL Configuration:
   - **Site URL:** your real deployed URL, e.g. `https://hastech-marketplace.vercel.app`
   - **Redirect URLs:** add `https://hastech-marketplace.vercel.app/auth/callback`
     (and, if you use a custom domain instead, that domain's `/auth/callback`).

   The app itself already passes an explicit `emailRedirectTo` on `signUp`/`resend`
   (`src/app/(auth)/actions.ts`, via `src/lib/app-url.ts`) so the link's target no longer
   depends on the Site URL default — but Supabase still refuses to redirect anywhere that
   isn't on this allow-list, so the URL must be added here regardless.

2. **Show the 6-digit code in the confirmation email (required for the code-entry flow).**
   Supabase always generates a `{{ .Token }}` for signup, but the default "Confirm signup"
   template only renders the link. Dashboard → Authentication → Email Templates →
   "Confirm signup" → add somewhere in the body, e.g.:
   ```html
   <p>Your confirmation code is: <strong>{{ .Token }}</strong></p>
   <p>Or click <a href="{{ .ConfirmationURL }}">this link</a> to confirm instead.</p>
   ```
   Until this is edited, `/verify-email`'s code field has nothing valid to accept — tell
   users to use the link in the meantime.

3. **Enable Google sign-in (optional — only if you want the Google button to work).**
   - Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID
     (type: Web application). Add this exact authorized redirect URI:
     `https://qslivegdfanutnsblnlo.supabase.co/auth/v1/callback` (replace the subdomain
     with your own project ref if different).
   - Supabase Dashboard → Authentication → Providers → Google → enable it, paste in the
     Client ID and Client Secret from the step above, and save.
   - Until this is done, the button shows "Google sign-in isn't set up for this store
     yet." instead of failing silently — see `src/components/auth/google-button.tsx`.

No code change is needed for any of the above; they're dashboard/console-only settings
that don't live in this repository.

## Deployment

- **App:** Vercel (or any Next.js host). Set the same env vars as `.env.local` in the
  project's environment settings, plus `NEXT_PUBLIC_APP_URL` set to your real domain.
- **Database/Auth/Storage:** Supabase, same project as development or a separate
  production project with the same migrations applied.
- **Storage:** `supabase/migrations/0011_storage.sql` creates the `product-images`
  bucket and its policies automatically against a real Supabase project (the
  migration no-ops safely against the local test database, which has no `storage`
  schema).
- **Webhook:** point your Paystack webhook URL at
  `https://<your-domain>/api/webhooks/paystack` (configured per-store is not
  necessary — the single endpoint looks up the right store from the payment
  metadata and verifies against that store's secret).

## Known limitations / explicitly deferred (documented, not hidden)

Per the brief's own instruction to build a real foundation rather than over-build V1,
the following are intentionally out of scope for this pass and are straightforward to
add without redesigning the schema:

- **Staff role:** `store_member_role` supports `staff` in the schema and RLS, but the
  dashboard has no UI yet to invite/manage staff members.
- **Custom domains:** stores are addressed by `/store/[slug]`. The schema doesn't
  block adding a `custom_domain` column + host-based routing later.
- **Service/booking & digital-download flows:** `product_type` (`physical` /
  `service` / `digital`) and per-business-type CTA labels exist, but there's no
  booking calendar or file-delivery flow yet — spec explicitly asked for the
  architecture to allow this, not to build it now.
- **Subscription/billing plans:** no `Free/Starter/Business` limits are enforced;
  spec asked not to artificially limit the first client during development.
- **Email notifications:** `notifications` is in-app only; no email sending is wired
  up yet.
- **Concurrency on the last unit of stock:** stock is re-checked at both add-to-cart
  and order-creation time, but two simultaneous checkouts on the very last unit could
  theoretically both pass the check before either decrements it. A `SELECT ... FOR
  UPDATE` row lock in `createOrderFromCart` would close this; documented rather than
  silently shipped.
- **End-to-end browser tests:** the full seller→customer→payment flow was verified by
  code review and the automated tests above, not by driving a real browser against a
  live Supabase + Paystack test project (no such project is available in this
  environment). Test manually against your own Supabase project before going live.

## Common problems

- **"Missing NEXT_PUBLIC_SUPABASE_URL"** — you haven't created `.env.local` from
  `.env.example`.
- **RLS test script fails to connect** — it needs a local Postgres reachable as a
  superuser (`createdb`/`dropdb`/`psql` on the current user or via `sudo -u postgres`).
  It never touches your real Supabase project.
- **Paystack initialize/verify errors** — confirm the store's Settings → Payments
  keys are test keys and match the mode of the card you're testing with.
- **Images don't show after upload** — confirm `supabase/migrations/0011_storage.sql`
  ran against your real Supabase project (it's a no-op on the local test database).
