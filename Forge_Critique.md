# Forge — Critics Panel Critique

Lead-intelligence app · `forge-lead-intelligence.netlify.app` · repo `D:\Business Analytics tool`
Panel: Product · Market · GTM · Engineering · Design · Finance · Risk · Chair
Method: code-read first, then dated live research. FACT = cited to code (file:line) or a linked source. INFERENCE = panel judgment.

---

## Verdict

Forge is a real, working pipeline — not vaporware — but it is **Not sellable as-is**. The build is two products wearing one UI: a credible "real mode" (Google Places → LLM scoring → format/identity/contact/reachability checks) and a default "synthetic mode" where the LLM invents businesses, addresses, phones, and emails with no source of truth. The default path ships fabricated PII into a CSV branded as "leads," which is the core liability. Two P0 blockers compound it: the Stage-2 identity check leans on a Clearbit free endpoint that was discontinued for new users on 2025-04-30 and is degrading (FACT), and reselling Google Places content as an exported lead database conflicts with Maps Platform terms (FACT). The hosted API authenticates all callers with one shared `FORGE_API_KEY` and has no per-tenant isolation, rate limiting, or logging (FACT). Demand for the category is real and growing (AI-SDR market $4.39B→$5.81B 2025→2026, CAGR ~32% — FACT), but Forge's wedge versus Clay/Apollo/Instantly is thin. Near-term: fix fabrication, ToS, and key model and it becomes a defensible low-end local-prospecting tool. Today it is a strong demo, not a product you can charge for.

**Readiness: Not — blocked by fabrication risk, Places/Clearbit ToS exposure, and single-key API auth.**

---

## As-built pipeline map (what the code actually does)

Two modes, decided purely by whether a Google Places key is present (`App.jsx:142`, `hasPlaces = !!googlePlacesKey.trim()`).

**Synthetic mode (DEFAULT — no Places key):**
1. **LLM Discovery** — `llm.js:callLLM` / `buildUserPrompt` (`llm.js:127`). Prompt asks the model to *generate* 10–20 businesses with name, address, phone, email, website, score, buy_probability. Nothing is real. `email:` is explicitly instructed to be *inferred* (`llm.js:181`).
2. **Format Validation** — `validate.js`. libphonenumber + `validator` check *shape only* (is this a valid-looking US phone / email / URL), not existence.
3. **Identity Check** — `enrich.js:enrichWithClearbit` → `autocomplete.clearbit.com/v1/companies/suggest`. Free, keyless. Sets `clearbit_match` = match/mismatch/not_found.
4. **Contact Enrichment** — Hunter.io domain-search (`enrich.js:69`, budget 25/mo) + AbstractAPI email/phone verify (`enrich.js:151`, top-5 hot). All optional.
5. **Reachability** — `verify.js:checkUrl` does a browser `fetch(url, {mode:'no-cors'})`; any non-thrown response counts as "live" (`verify.js:5`).
6. Final filter: keep only `score === 'hot' && web_verified === true` (`App.jsx:300`). CSV export via `csv.js`.

**Real mode (Places key set):** inserts Stage 0 `searchPlaces` (`places.js:75`) — Places Text Search "New", `maxResultCount: 20`, single query string per product (`PRODUCT_QUERY_MAP`, `places.js:8`). Then `scorePlacesLeads` (`llm.js:19`) scores the *real* rows instead of inventing them. Stages 2–6 identical.

**Hosted API** (`netlify/functions/forge-leads.mjs`): synthetic-mode-only (no Places stage). Auth = one shared bearer token compared to `process.env.FORGE_API_KEY` (`forge-leads.mjs:377-380`). Caller supplies their own LLM + enrichment keys in the POST body. CORS `*` (`forge-leads.mjs:14`). `forge-health.mjs` is unauthenticated and static.

**Auth (app):** `LoginView.jsx` — single hardcoded password, default `'curcible'` (`LoginView.jsx:4`), checked client-side, sets `localStorage.forge_session = '1'`. No accounts, no server.

**Key storage:** every key (LLM, Places, Hunter, AbstractAPI) lives in `localStorage` and is sent direct from the browser to each provider (`App.jsx:88-107`, `providers.js:13`). Anthropic path sets `anthropic-dangerous-direct-browser-access: true` (`providers.js:74`).

---

## Per-lens critique

### 1. Product Strategist
- **FACT** — Default mode produces synthetic leads (`llm.js:181` instructs inferring emails; the whole `buildUserPrompt` invents businesses). The JTBD ("give me real local prospects to sell to") is only met in real mode, which is off by default and requires GCP billing setup.
- **INFERENCE** — This is a **painkiller in real mode, a toy in synthetic mode**. Shipping both behind one button erodes trust the first time a user calls a fabricated number.
- **INFERENCE** — Wedge is "local SMB prospecting tied to 8 Blueprint products you also sell." That coupling (`products.js`) is the only differentiation; standalone it's a thin Places-scraper-plus-LLM.
- **Unknowns:** Is Forge sold standalone or only as a funnel for the Blueprint products? Who is the buyer — agencies, or Curcible's own sales motion? The answer changes whether fabrication is fatal or merely embarrassing.

### 2. Market Analyst
- **FACT** — Category demand is strong: AI-SDR market $4.39B (2025) → $5.81B (2026), ~32% CAGR; 87% of sales orgs already use AI for prospecting/scoring [MarketsandMarkets / TheBusinessResearchCompany, 2026].
- **FACT** — Incumbents are entrenched and cheap at entry: Apollo $49–59/user/mo, Instantly from $37.60–47/mo, Clay from $185/mo post-March-2026 restructure [vendor pages, 2025-26]. Clay/Apollo carry verified B2B contact databases Forge does not have.
- **INFERENCE** — Saturated mid-market; the defensible gap is *hyper-local SMB* (plumbers, salons, clinics) that Apollo/ZoomInfo under-index. Forge's Places approach fits that gap — but only in real mode.
- **Unknowns:** willingness-to-pay for local-only leads; whether buyers tolerate Places-sourced data given freshness limits.

### 3. Growth / GTM Operator
- **FACT** — Time-to-value in real mode is gated by GCP project + billing + Places API enablement (`SettingsView.jsx:161`). That is a multi-step, card-required setup before first real result — high activation friction.
- **FACT** — Default run needs only a free LLM key, so first-run TTV is fast — but the output is synthetic, so "fast value" is fake value.
- **INFERENCE** — No pricing primitive exists: single shared API key (`forge-leads.mjs:377`), no metering, no plans. Cannot bill self-serve today.
- **INFERENCE** — Virality near zero (no sharing, no team, no referral surface). CSV is the only artifact.

### 4. Engineering / Reliability Critic
- **FACT — Fabrication.** Synthetic mode emits invented name/address/phone/email with zero grounding (`llm.js:127-184`). Format validation (`validate.js`) passes anything *well-formed*, so a hallucinated but plausible `+1 (512) 555-0142` and `info@madeupco.com` sail through as "valid."
- **FACT — Dead/degrading dependency.** Stage-2 identity relies on `autocomplete.clearbit.com/v1/companies/suggest` (`enrich.js:8`). Clearbit's free Name-to-Domain/autocomplete was discontinued for new users 2025-04-30; remaining access is legacy, unsupported, "could stop working at any time," logo already nulled [Clearbit changelog / help center, 2025-26]. When it returns null the pipeline silently records `not_found` (`enrich.js:33`) — the identity check quietly becomes a no-op with no alert.
- **FACT — Reachability is weak.** `checkUrl` uses `mode:'no-cors'` and treats *any* non-throwing response as live (`verify.js:5-7`). It cannot read status codes; a parked domain, 404, or soft-fail page all count as "live." The serverless variant uses HEAD and treats `<500` as live (`forge-leads.mjs:337`) — also passes 404s.
- **FACT — Single-key API, no isolation.** All API callers share one `FORGE_API_KEY` (`forge-leads.mjs:380`). No per-tenant identity, no rate limiting, no quota, no request logging, no abuse throttle. One leaked key = full open access.
- **FACT — Browser-side keys.** LLM/Places/Hunter/Abstract keys are stored in `localStorage` and sent from the browser (`App.jsx:88-107`). Places key in particular is high-value and billable; any XSS or shared machine leaks it. Anthropic direct-browser flag is set (`providers.js:74`).
- **FACT — No tests.** Zero `.test`/`.spec` files in the repo. No CI. Brittle JSON parsing (`parseLeadsArray`, `llm.js:5`) throws the whole run on one malformed model response; no retry/fallback despite README claiming a "Free LLM Router … Groq→AI Studio→OpenRouter fallback" (README) that **does not exist in code**.
- **FACT — Places query is shallow.** One `searchText` call, `maxResultCount: 20`, one canned query per product (`places.js:8,88`). No pagination, no de-dupe across runs, no geographic tiling — caps real mode at ~20 raw rows/run before filtering, often yielding a handful of "hot+live" leads.
- **INFERENCE** — Name-based merge in `scorePlacesLeads` (`llm.js:115`, match by `s.name === place.name` then index fallback) will mis-attach LLM scores if the model renames a business.

### 5. Design / UX Critic
- **FACT** — The synthetic/real distinction is buried in Settings prose (`SettingsView.jsx:121-123`), not surfaced on the run screen. The Forge header says "Finds businesses in your target market" (`ForgeView.jsx:34`) — true only in real mode. A user running the default sees no warning that results are generated.
- **FACT** — Empty state is clean (`ForgeView.jsx:97-111`); pipeline animation and logs are a genuine strength.
- **INFERENCE** — No per-lead provenance badge ("Google Places" vs "LLM-generated"). The CSV carries `clearbit_match` and `confidence` columns that imply verification even when every upstream check no-op'd.
- **INFERENCE** — Self-serve onboarding for real mode (GCP billing) is too heavy for the target SMB/agency operator without a guided walkthrough.

### 6. Finance / Unit-Economics Critic
- **FACT** — User-supplied keys mean Forge's *direct* COGS per run is ~$0 (LLM on free tiers; Places $0.032/req under the $200 GCP credit ≈ 6,250 searches/mo — `places.js:3`, `SettingsView.jsx:157`). The cost sits on the *customer's* GCP/Hunter/Abstract accounts.
- **INFERENCE** — That is also the problem: with no metering and BYO-keys, there is no usage-based revenue hook. Margin is "whatever you charge for the wrapper," and the wrapper is cloneable.
- **INFERENCE** — Free-tier ceilings are low and shared per provider key (Hunter 25/mo, Abstract 100/mo — `enrichUsage.js`). A serious user exhausts enrichment in days; the app tracks this in `localStorage` only, so it is per-browser, not enforced.
- **INFERENCE** — Viable price *if* fabrication/ToS fixed and real mode is default: $29–79/mo for a single-operator local-prospecting tool, undercutting Apollo's $49+/user — but only with a hosted, metered backend.

### 7. Risk / Compliance Critic
- **FACT — Google Places ToS.** Maps Platform terms prohibit reselling/redistributing Places content and bar caching beyond `place_id`; you may not feed Places data into a competing places database or a resold derivative dataset [Google Maps Platform Service Terms / Places policies, 2025-26]. Forge exports Places-sourced name/address/phone into a downloadable CSV "lead sheet" (`csv.js`) — that is redistribution of Places Content and a direct ToS conflict if Forge is sold.
- **FACT — Clearbit.** Free autocomplete is deprecated/unsupported (above); relying on it in a paid product is both a reliability and a terms risk.
- **FACT — GDPR / CAN-SPAM.** Forge produces contact data plus per-lead `sale_strategy` outreach scripts (`llm.js:177`). Hunter B2B email is generally defensible under GDPR legitimate interest *if* outreach includes opt-out [Hunter.io GDPR docs, 2026]; Forge ships no consent posture, no unsubscribe scaffolding, no data-source labeling, and synthetic emails have no lawful basis because the person may not exist.
- **FACT — Key exposure.** Browser-stored keys + shared `FORGE_API_KEY` + CORS `*` (`forge-leads.mjs:14`) is an exfiltration and abuse surface.
- **INFERENCE** — Selling fabricated personal contact data (synthetic mode) is the sharpest legal/reputational exposure of all — it manufactures PII about possibly-nonexistent or wrongly-named real people.

---

## Scorecard (0–5)

| Dimension | Score | Basis |
|---|---|---|
| Build completeness | 3 | Real mode works end-to-end; synthetic default + dead Clearbit + no tests/router |
| Differentiation | 2 | Local-SMB wedge real but thin vs Apollo/Clay/Instantly |
| Demand | 4 | AI-SDR/lead-gen growing ~32% CAGR into 2026 |
| Margin | 2 | BYO-keys = ~$0 COGS but no metering/revenue hook |
| GTM-readiness | 1 | No plans, no per-tenant auth, heavy real-mode setup |
| Reliability | 2 | Weak reachability, brittle parse, no fallback, deprecated dep |
| Compliance | 1 | Places resale + synthetic PII + key exposure |
| **Overall** | **2.0** | **Not sellable until P0s clear** |

---

## Claims vs reality

| Claim (README / api.html / UI) | Reality (code) | Verdict |
|---|---|---|
| "Free LLM Router — Groq→AI Studio→OpenRouter fallback" (README) | No router/fallback exists; single provider, one call, throws on failure (`llm.js`) | FALSE |
| "ScrapeGraphAI deep-scrapes each site: services, team, tech stack" (README) | No scraping anywhere; services/tech_stack are LLM-guessed (`llm.js:152`) | FALSE |
| "local-client-prospector: Google Maps, Yelp, BBB" (README) | Only Google Places Text Search; no Yelp/BBB (`places.js`) | FALSE |
| "Finds businesses in your target market" (`ForgeView.jsx:34`) | True only in real mode; default invents them | MISLEADING |
| "Clearbit identity check" (UI Stage 2) | Endpoint deprecated/unsupported for new users since 2025-04-30; silently no-ops | BROKEN |
| api.html: "get back … live, enriched leads" | "Live" = any non-throwing fetch incl. 404/parked (`verify.js`) | OVERSTATED |
| "Keys scoped per client" (api.html auth) | One shared `FORGE_API_KEY` for all callers (`forge-leads.mjs:380`) | FALSE |
| "No backend" positioned as feature (README) | Means keys in browser + no auth/metering — a liability, not a feature | MISLEADING |

---

## Prioritized fix list

### P0 — blocks any sale
1. **Kill or quarantine synthetic mode.** Make Places the only lead source; or gate synthetic behind an explicit "demo data — not real" mode that cannot export CSV. *Why:* fabricated PII is the central legal/trust failure. *Files:* `App.jsx:142-202`, `ForgeView.jsx`, `forge-leads.mjs` (synthetic-only API must change). *Effort:* 1–2 days.
2. **Resolve Places redistribution.** Either (a) stop exporting raw Places fields and treat Places only as an in-app discovery surface, storing only `place_id`, or (b) move to a license that permits resale (e.g., a provider whose terms allow it). *Why:* exporting Places Content as a sold lead sheet conflicts with Maps Platform terms. *Files:* `places.js`, `csv.js`. *Effort:* 1–3 days + legal review.
3. **Replace the single-key API with per-tenant auth + rate limiting + logging.** Issue per-client keys, meter usage, throttle, log. *Why:* one shared bearer = unbounded abuse and no billing. *Files:* `forge-leads.mjs`, add a KV/DB + middleware. *Effort:* 3–5 days.
4. **Remove or replace Clearbit identity stage.** Swap the deprecated autocomplete for a supported name→domain provider, or drop the stage and stop emitting `clearbit_match`/inflated `confidence`. *Why:* shipping a check that silently does nothing misleads buyers. *Files:* `enrich.js:1-47`, `enrich.js:205` (confidence), `csv.js`. *Effort:* 0.5–1 day to remove; 2 days to replace.
5. **Get keys out of the browser.** Proxy LLM/Places/enrichment through the serverless backend with server-held keys. *Why:* billable-key exfiltration risk. *Files:* `providers.js`, `App.jsx`, new proxy function. *Effort:* 2–4 days.

### P1 — blocks self-serve
6. **Real auth** (replace hardcoded `'curcible'` password — `LoginView.jsx:4`) with accounts/sessions. *Effort:* 2–3 days.
7. **Harden reachability** — read real status codes server-side, classify parked/404, stop counting them as live (`verify.js`, `forge-leads.mjs:332`). *Effort:* 0.5 day.
8. **LLM robustness** — retry + provider fallback + tolerant JSON repair so one bad response doesn't kill the run (`llm.js:5`). *Effort:* 1 day.
9. **Places depth** — pagination + de-dupe + geo-tiling to exceed 20 rows/run (`places.js`). *Effort:* 1–2 days.
10. **Provenance + compliance UI** — per-lead source badge, data-source column, unsubscribe/opt-out guidance on outreach output. *Effort:* 1 day.

### P2 — polish
11. Test suite + CI (currently zero tests). *Effort:* 2–3 days.
12. Fix README/api.html claims to match the real pipeline (remove ScrapeGraphAI/Yelp/router fiction). *Effort:* 2 hours.
13. Name-merge by `place_id` not display name (`llm.js:115`). *Effort:* 1 hour.
14. Usage metering server-side instead of `localStorage` (`enrichUsage.js`). *Effort:* 0.5 day.

---

## What good looks like (minimum to charge money)

A hosted, metered, real-data-only Forge:
- **Real source only.** Places (or a resale-licensed source) is the sole discovery path; synthetic generation is removed or sandboxed as labeled, non-exportable demo data. *(P0-1, P0-2)*
- **Server-side keys + per-tenant API.** All third-party calls proxied; each customer has their own key, quota, rate limit, and log. Billing hooks to metered usage. *(P0-3, P0-5)*
- **Honest enrichment.** Every "check" either works or is removed; `confidence` reflects only checks that actually ran. No deprecated dependencies in the critical path. *(P0-4, P1-7)*
- **Compliant output.** Per-lead provenance, data-source labeling, opt-out guidance on outreach scripts; no fabricated-person records. *(P1-10)*
- **Reliability floor.** LLM retry/fallback, real reachability classification, Places pagination, and a basic test suite. *(P1-8, P1-9, P2-11)*

Hit those and Forge can defensibly charge ~$29–79/mo as a hyper-local SMB prospecting tool below Apollo/Clay. Short of them, it remains a demo.

---

## Sources (dated, linked)

- Google Maps Platform Service Specific Terms — caching/resale restrictions, `place_id` exemption. https://cloud.google.com/maps-platform/terms/maps-service-terms · Places policies https://developers.google.com/maps/documentation/places/web-service/policies (accessed 2026-06-25)
- Clearbit free tools discontinued 2025-04-30; Name-to-Domain/autocomplete deprecated, logo nulled 2025-09, Logo API sunset 2025-12. Clearbit changelog https://clearbit.com/changelog · Autocomplete FAQ https://help.clearbit.com/hc/en-us/articles/8502992633111 (accessed 2026-06-25)
- AI-SDR market $4.39B→$5.81B 2025→2026, ~32% CAGR; 87% sales orgs use AI for prospecting. https://www.marketsandmarkets.com/Market-Reports/ai-sdr-market-83561460.html · https://www.thebusinessresearchcompany.com/report/artificial-intelligence-ai-sales-development-representative-sdr-global-market-report (accessed 2026-06-25)
- Clay pricing (Launch $185 / Growth $495 post-March-2026 restructure). https://www.clay.com/pricing · https://www.warmly.ai/p/blog/clay-pricing (accessed 2026-06-25)
- Apollo.io pricing ($49–59 Basic / $99 Pro / $149 Org per user/mo). https://www.apollo.io/pricing · https://www.cognism.com/blog/apollo-io-pricing (accessed 2026-06-25)
- Instantly.ai pricing (Growth $37.60–47/mo; Lead Finder credits). https://instantly.ai/pricing · https://puzzleinbox.com/blog/instantly-pricing-guide (accessed 2026-06-25)
- Hunter.io GDPR/cold-email posture (legitimate-interest basis, opt-out required). https://help.hunter.io/en/articles/1890029-gdpr-compliance · https://hunter.io/blog/cold-email-legal-regulations/ (accessed 2026-06-25)
