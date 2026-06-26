# Forge — Deploy & Sell-Ready Checklist

What changed in this pass (P0/P1 from the critics panel) and the steps to ship.

## Code changes (done, build-verified)
- **No more fabricated leads.** The generative "LLM invents businesses" path is gone from the app and the API. Google Places is the only lead source.
- **Sample mode.** Without a Places key, the app shows a static, watermarked `SAMPLE` dataset (fictional, non-exportable) so first-run still demos the pipeline.
- **ToS-safe export.** CSV/API omit Places content (name/address/phone/website). They ship `place_id` + a `place_id` Maps link + Curcible intelligence + independently-sourced (Hunter) email + a compliance note.
- **Dead Clearbit stage removed.** Confidence now counts only checks that actually ran.
- **Honest reachability.** App labels "Resolves" (not "Live"); the API counts only 2xx/3xx as reachable (404/parked no longer pass).
- **LLM robustness.** Retry + tolerant JSON parse; scores merged by `place_id`, not display name.
- **Backend hardening.** `forge-leads.mjs` is now Places-backed, holds all keys server-side, supports per-tenant API keys with rate limit + monthly quota + usage logging (Supabase), and scoped CORS.
- **Claims corrected.** README + `public/api.html` no longer reference ScrapeGraphAI, Yelp/BBB, an LLM "router," Clearbit, or per-request provider keys.

## Deploy steps
1. **Supabase**
   - Create a project (or reuse one). Get the URL + service-role key.
   - Apply `supabase/migrations/0001_forge_tenancy.sql` (`supabase db push`, or paste in the SQL editor).
   - Run `supabase/seed_tenant.sql` to mint your first tenant + API key (the plaintext key prints once — store it).
2. **Netlify env** — set everything in `.env.forge.example` (Site settings → Environment variables). At minimum: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FORGE_PLACES_KEY`, `FORGE_LLM_KEY`, `FORGE_LLM_PROVIDER`, `FORGE_LLM_MODEL`. Set `FORGE_ALLOWED_ORIGINS` to your domain.
3. **Deploy** — push to the connected branch; Netlify builds `vite build` + functions.
4. **Smoke test**
   ```
   curl -s https://<site>/api/v1/leads \
     -H "Authorization: Bearer <tenant_key>" \
     -H "Content-Type: application/json" \
     -d '{"state":"Texas","country":"United States","product":"P08"}'
   ```
   Expect `ok:true`, `meta.source:"google_places"`, and ToS-safe lead objects (no `name`/`address`).

## Still open (next pass)
- **Real accounts** for the app (replace the `VITE_APP_PASS` gate). P1.
- **Billing**: wire Stripe to `forge_tenants.plan` / `monthly_quota`; usage already metered in `forge_usage_events`.
- **Places depth**: pagination + geo-tiling to exceed ~20 rows/run. P1.
- **Tests + CI**: none yet. P2.
- **Legal**: confirm the place_id-only export posture with counsel before selling, or move discovery to a resale-licensed source.
- **Product taxonomy**: align all marketing docs to the reference-doc names (the API now uses InboxCore/ContentCore/LeadCore/PostCore/ReportCore/KnowCore/MeetCore/SchedCore).

---

## Provisioned (this pass)

A Supabase project is live and the schema is applied.

- **Project:** `curcible-forge` · ref `rjgeedzpqcbylgnxwxml` · region us-east-1 · free tier ($0/mo)
- **URL:** `https://rjgeedzpqcbylgnxwxml.supabase.co`
- **Publishable (anon) key (public, safe in browser):** `sb_publishable_kMy9fvicd9yIoN7NupGahg_h0tfFqGh`
- **Service-role key:** NOT retrievable here. Copy it from Supabase → Project Settings → API → `service_role`. Put it in Netlify env as `SUPABASE_SERVICE_ROLE_KEY`. Never ship it to the browser.
- **Migrations applied:** `0001_forge_tenancy.sql`, `0002_forge_accounts.sql`.
- **Seed:** one internal tenant (plan `pro`, quota 1000) + one API key was minted (plaintext shown once in chat — store it in a password manager).

### Account system (built)
- App login is now real: Supabase email/password (`src/views/AuthView.jsx`). The old `VITE_APP_PASS` gate is removed from `App.jsx`.
- New **Account** view (`src/views/AccountView.jsx`): shows plan, monthly quota, usage, and lets each user create/revoke their own hosted-API keys. Backed by `SECURITY DEFINER` RPCs scoped to `auth.uid()` — no extra serverless code, no service-role key in the browser.
- On first visit the app calls `forge_bootstrap_tenant()` to create the user's tenant automatically.

### Netlify env to set before deploy
Server (functions): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FORGE_PLACES_KEY`, `FORGE_LLM_KEY`, `FORGE_LLM_PROVIDER`, `FORGE_LLM_MODEL`, optional enrichment keys, `FORGE_ALLOWED_ORIGINS`.
Build (app, public): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (defaults are baked in, but set them to be explicit).

### One Supabase setting to decide
Auth → Providers → Email: **email confirmation** is ON by default. With it on, a new signup must confirm via email before first sign-in. Turn it off for instant signup during early testing if you prefer.

---

## Stripe billing (built)

Self-serve upgrade is wired to the metered tenants. Plans (edit in `netlify/functions/_shared/plans.mjs`): free 50/mo, starter 500/mo, pro 5,000/mo.

Flow: **Account → Plans → Upgrade** calls `POST /api/v1/billing/checkout` (auth = the user's Supabase session) → Stripe Checkout → on success Stripe fires `POST /api/v1/billing/webhook` → the webhook sets the tenant's `plan` / `monthly_quota` / `rate_per_min`. The hosted API's gate (`forge_authorize`) already enforces those numbers.

### To activate
1. In Stripe, create two recurring products/prices (Starter, Pro). Copy their price IDs.
2. Set Netlify env: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `APP_URL`.
3. Add a webhook endpoint in Stripe pointing to `https://<site>/api/v1/billing/webhook`, subscribe to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy its signing secret to `STRIPE_WEBHOOK_SECRET`.
4. DB columns are already applied (migration `0003_forge_billing.sql`).

Migration `0003_forge_billing.sql` applied to the live project (ref `rjgeedzpqcbylgnxwxml`).

---

## Email confirmation + smoke test (need your action)

**Email confirmation** is a project Auth setting and can't be toggled from here. To allow instant signup during testing: Supabase dashboard → Authentication → Sign In / Providers → Email → turn **Confirm email** off. Leave it on for production.

**Live smoke test** (run after Netlify env is set + a deploy):
```
curl -s https://<site>/api/v1/leads \
  -H "Authorization: Bearer forge_1993c269dd94a738c8036569b38c82cd352fff496a5f8d4c" \
  -H "Content-Type: application/json" \
  -d '{"state":"Texas","country":"United States","product":"P08"}'
```
Expect `ok:true`, `meta.source:"google_places"`, ToS-safe lead objects (no `name`/`address`). A 401 means the key/Supabase env is off; a 500 about `FORGE_PLACES_KEY` means provider keys aren't set yet.

---

## Stripe products created (TEST mode)

Created in account `acct_1Sv9M630ZX4yVabA` (livemode=false):

| Plan | Product | Price ID (test) | Amount |
|---|---|---|---|
| Starter | prod_UmADgG8nh34Gib | `price_1TmbtY30ZX4yVabANftJOnkw` | $49/mo · 500 runs |
| Pro | prod_UmADQJZ4LbUGT8 | `price_1TmbtY30ZX4yVabAGqsYSDEO` | $149/mo · 5,000 runs |

Set `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` to these in Netlify, plus `STRIPE_SECRET_KEY` (test key `sk_test_...`) and `STRIPE_WEBHOOK_SECRET`. Test card: `4242 4242 4242 4242`, any future expiry/CVC.

**Going live:** these are TEST products. When ready for real charges, flip Stripe to Live, re-create the two products/prices in live mode (I can do this once the connector is in live mode), and swap the env to the `sk_live_...` key + live price IDs + live webhook secret.
