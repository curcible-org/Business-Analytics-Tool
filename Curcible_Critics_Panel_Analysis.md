# Curcible — Critics Panel Analysis

> Adversarial audit of all products in the repo. Panel: Product Strategy · Market · Growth/GTM · Engineering · Design/UX · Finance · Risk/Compliance · Chair.
> Audit date: 2026-06-25. FACT = cited/dated source. INFERENCE = panel judgment.

---

## Verdict

- **Two product lines, two maturity levels.** The 8 n8n "Core" workflows are real, importable JSON — but **thinner than the marketing spec claims** (P02–P06, P08 ship 4–7 nodes against documented 11–14). Forge is the only genuinely working software: real Google Places + Clearbit + Hunter + AbstractAPI calls, six-stage pipeline, CSV export, live URL.
- **Three conflicting product taxonomies** exist in the repo (reference doc vs. `products.js` vs. `forge-leads.mjs`). P03/P04/P05/P08 have different names and functions across files. This is a credibility and delivery risk: a buyer who reads the site and receives the JSON gets mismatched products.
- **One-time $79 n8n templates is a structurally weak model** — low ceiling, no recurring revenue, high support burden when APIs change, undifferentiated against free n8n community templates (10,000+) and $29–$299 marketplaces.
- **Forge has a fatal compliance exposure** (reselling Google Places-derived data violates Maps ToS) and an architectural one (API keys in the browser). It is a strong internal tool, weak external product as built.
- **The market is shouting one direction:** AI voice agents (39% CAGR) and AI SDR/lead-intelligence delivered as a **productized retainer** ($6k–$12k/mo), not as a $79 download.
- **The pick: Forge, repositioned from a free internal tool into a productized "done-with-you" local-lead-intelligence service** priced at retainer/subscription, using the 8 Core workflows as fulfillment leverage — not as the product. It is the fastest credible path to first revenue because the engine already runs.

---

## Per-product critique

Panel viewpoints condensed. Killer questions are the ones a buyer or investor asks that the current build cannot answer.

### Repo-verified state (FACT)

| ID | Doc/site claim | Shipped JSON reality | Node count: doc vs actual |
|---|---|---|---|
| P01 InboxCore | Gmail triage → HubSpot/Notion/Slack/Airtable | Gmail + GPT-4o classify + draft + digest. **No HubSpot/Notion/Slack/Airtable nodes** | 11 vs **11** (but different nodes) |
| P02 ContentCore | SerpAPI + DALL·E 3 + Notion + Slack + Airtable | Perplexity + GPT-4o + WordPress + Google Sheets only | 11 vs **5** |
| P03 LeadCore | Apollo enrich + BANT scoring + HubSpot (doc) / "LinkedIn scraper" (code) | 6 nodes | 12 vs **6** |
| P04 PostCore/SocialCore | 4 native platform APIs (doc) / 9 platforms (code) | Airtable + GPT-4o + **Blotato** (single 3rd-party) + Airtable | 12 vs **4** |
| P05 ReportCore/TalentCore | GA4+Stripe+HubSpot digest (doc) / "HR screener" (code) | 6 nodes | 14 vs **6** |
| P06 KnowCore | Twilio + Pinecone RAG + Slack + Airtable | 7 nodes | 12 vs **7** |
| P07 MeetCore | AssemblyAI + 6 outputs | **29 nodes**, multi-platform (Zoom/Meet/Teams) — exceeds spec | 16 vs **29** |
| P08 SchedCore/TubeCore | Calendar booking (doc) / "YouTube summaries" (code) | 10 nodes | 13 vs **10** |

**INFERENCE:** The reference doc and `catalog.js` are aspirational marketing copy written ahead of the build. The shipped JSON is leaner and in several cases a *different product*. This gap must be closed before any sale — it is a refund/chargeback generator.

### The n8n Core line (P01–P08) — panel composite

- **Product Strategy.** JTBD is real (SMBs want automation without building it). But the wedge is weak: import-ready JSON is a commodity. n8n's own community library has 10,000+ free workflows incl. 1,478 sales workflows (FACT). Differentiation = documentation + support, not the workflow itself. No moat.
- **Market.** Demand exists but is saturated at the low end. Gumroad template buyers expect $19–$79 and "tested, documented, supported like professional tools" (FACT) — exactly where the current node-gap fails.
- **Growth/GTM.** One-time $79 = no LTV, no expansion, CAC must be ~$0 (organic/SEO) to work. No funnel, no audience, no list in the repo. Gumroad links exist (`curcible.gumroad.com/l/*`) but no traffic engine.
- **Engineering/Reliability.** Brittle by category: every product depends on 4–8 third-party OAuth credentials the buyer must configure (1–6h setup). When OpenAI/HubSpot/Twilio/Meta change an API, every buyer's workflow breaks and emails *you*. Support cost scales with units sold — the opposite of a digital product's promise.
- **Design/UX.** Time-to-value is poor: "Advanced (4–6h setup)" for KnowCore means most buyers never activate. No onboarding wizard, no credential helper, no test harness.
- **Finance.** Gross margin on the file is ~100%, but *true* margin after support is unknown and likely negative on complex SKUs. At $79 × realistic volume (tens/month without an audience), this is a side-income tier, not a business. Reference creator example: 5 templates → $3,200/mo with ongoing maintenance (FACT) — that's the realistic ceiling.
- **Risk/Compliance.** Buyers run these on their own keys, so platform risk is transferred — good. But trademark "™" on every name with no registration, and "GPT-4o" hard dependency, are minor exposures.

**Killer questions the Core line can't answer:**
1. Why pay $79 when n8n's free library has a comparable workflow? (Answer must be support + outcome, which isn't packaged.)
2. The site says 11–14 nodes; the file has 4–7. Which is real?
3. P03/P04/P05/P08 are named two different things in two files. What am I actually buying?
4. Who fixes it when HubSpot's API changes in 4 months?
5. Where is one screenshot of it running on real data?

### Forge — panel composite

- **Product Strategy.** Strong JTBD: "find local SMBs that need product X, scored and contactable." The Blueprint-product targeting (score leads *for a specific offer*) is a genuine, defensible angle vs. generic Apollo lists. **INFERENCE: this is the only asset with a real wedge.**
- **Market.** Squarely in the AI SDR / lead-intelligence market: $4.27B in 2025 → $5.22B 2026, 21.2% CAGR (FACT, Fortune Business Insights). Crowded at the top (Clay $185–$495/mo, Apollo $59–$149/seat, Instantly from $30/mo — FACT) but the **local-SMB + done-for-you** niche is underserved by those horizontal tools.
- **Growth/GTM.** Best channel-product fit of anything in the repo: the tool *itself produces the prospect list* for outreach (dogfood loop). Channel = cold outreach to agencies/SMBs using Forge's own output.
- **Engineering/Reliability.** Pipeline is real and well-structured (6 stages, budget-aware enrichment, libphonenumber/validator). **But:** LLM-only mode **fabricates businesses** (`buildUserPrompt` asks the model to "generate realistic leads") — selling hallucinated leads is a fraud/quality bomb. API keys live in `localStorage` and calls fire from the browser (key leakage). Clearbit autocomplete is a deprecated/absorbed dependency (HubSpot Breeze) — unreliable long-term.
- **Design/UX.** Clean, on-brand, fast time-to-value (enter state + product → scored sheet). Self-serve viable *if* keys are managed server-side. Today it requires the user to paste 4+ API keys — high friction.
- **Finance.** COGS is near-zero in free-LLM mode; Google Places is $0.032/req with $200/mo free credit (~6,250 searches) (FACT). Margin is excellent. The question is pricing power — currently $0 (internal/free).
- **Risk/Compliance.** **Material.** Google Maps ToS: content except place IDs "cannot be cached or stored," and reselling Places data violates terms (FACT, Google policies). Forge's CSV export of Places-derived business data is direct ToS exposure if sold. GDPR/CCPA apply to exported contact data. Browser-side keys = security finding.

**Killer questions Forge must answer:**
1. In LLM-only mode, are these real businesses or model inventions? (Currently: invented.)
2. Are you allowed to resell Google Places data? (Currently: no, per ToS.)
3. Where do my API keys go? (Currently: my browser, exposed.)
4. What's the accuracy rate vs. Apollo/Clay on a 100-lead sample? (Unmeasured.)
5. Why pay you instead of running Apollo myself? (Answer = local-SMB scoring + done-for-you, which must be the product.)

### Pulse & Broadcast

- **State (FACT):** stubs only. `Hub.jsx` marks both `status: 'soon'`, label "In development." No routes, no logic.
- **Verdict:** ignore until Forge generates revenue. Broadcast (outreach sequencer) is the natural Forge attach, not a separate bet.

---

## Rollout-readiness scorecard

Scale 0–5. Risk is inverted (5 = lowest risk). **Ship-ready** = Build ≥4, Differentiation ≥3, Demand ≥3, GTM ≥3, no blocking compliance issue.

| Product | Build | Diff. | Demand | Margin | GTM | Risk(inv) | Avg | Status |
|---|---|---|---|---|---|---|---|---|
| P01 InboxCore | 3 | 1 | 3 | 3 | 2 | 4 | 2.7 | Not |
| P02 ContentCore | 2 | 1 | 3 | 3 | 2 | 4 | 2.5 | Not |
| P03 LeadCore | 2 | 2 | 3 | 3 | 2 | 3 | 2.5 | Not |
| P04 PostCore | 2 | 1 | 2 | 3 | 2 | 3 | 2.2 | Not |
| P05 ReportCore | 2 | 2 | 2 | 3 | 2 | 4 | 2.5 | Not |
| P06 KnowCore | 3 | 3 | 3 | 3 | 2 | 3 | 2.8 | Near (best Core) |
| P07 MeetCore | 4 | 2 | 3 | 3 | 2 | 4 | 3.0 | Near |
| P08 SchedCore | 3 | 2 | 3 | 3 | 2 | 4 | 2.8 | Not |
| **Forge** | **4** | **4** | **4** | **4** | **4** | **2** | **3.7** | **Near — gated on compliance + keys** |
| Pulse | 0 | — | 3 | — | — | — | — | Not (stub) |
| Broadcast | 0 | — | 3 | — | — | — | — | Not (stub) |

**INFERENCE:** Forge is the only product above 3.0 on a path that fixes its one blocking issue (Risk=2). P07 MeetCore is the strongest Core SKU (build exceeds spec) and the only one worth keeping on the storefront short-term.

---

## Gap analysis

| Product | Missing to be sellable & 2026-competitive |
|---|---|
| **Forge** | (1) **Reconcile to real, lawful data sourcing** — drop Places resale; use first-party scrape of public sites or licensed data, OR sell the *output as a service* not the *data as a file*. (2) Kill LLM-only "invented leads" mode for paid use. (3) **Move keys + LLM calls server-side** (the `forge-leads.mjs` function already exists — route everything through it). (4) Proof: accuracy benchmark vs. Apollo on 100 leads. (5) Pricing + billing. (6) ToS/privacy policy. |
| Core line (all) | (1) **Make the JSON match the marketing** (close the node gap) or rewrite the marketing to match the JSON. (2) Resolve the 3-way naming conflict. (3) Per-product 60-sec demo video on real data. (4) Credential setup wizard / Loom per product. (5) One case study with a number. (6) Refund + support policy. |
| P06 KnowCore | Hosted vector DB option; without Pinecone setup, 4–6h activation kills conversion. Add a managed-RAG tier. |
| P07 MeetCore | Already strong; needs a 1-click demo and a privacy stance on recording/transcription consent. |
| Pulse/Broadcast | Everything. Defer. Broadcast should ship *inside* Forge as the outreach step. |

---

## The pick + justification

**Pick: Forge — repositioned as a productized local-lead-intelligence offer (done-with-you, subscription/retainer), with the Core workflows as fulfillment leverage.**

Scoring the Chair's criterion = *fastest credible first revenue × market size × defensibility*:

| Option | First-revenue speed | Market size | Defensibility | Blocking issue |
|---|---|---|---|---|
| **Forge (repositioned)** | **High — engine runs today** | **High — $5.2B AI SDR market, 21% CAGR** | **Medium-High — local-SMB scoring niche** | Compliance + keys (fixable in days) |
| Core line as $79 downloads | Medium | Low (commodity) | Low (free alternatives) | Node-gap + naming, low ceiling |
| AI voice agents (new build) | Low — nothing built | **Highest — 39% CAGR to $35B** | Medium | 0% built; 3–6mo to credible MVP |
| Pulse / Broadcast | Low — stubs | Medium | Low | Not started |

**Why not voice agents, despite the bigger market and the tagline?** FACT: AI voice market is $2.54B→$35.24B at 39% CAGR (Grand View) — the most attractive *market*. But there is **zero built** in the repo, platform per-minute economics are thin once STT+LLM+TTS+telephony stack ($0.13–0.31/min all-in, FACT), and credible MVP is months out. It is the right **Phase 2**, not the first-revenue play. Build the lead-gen muscle first, then sell voice agents *to the leads Forge finds*.

**Why not the Core line?** One-time $79 against 10,000+ free n8n workflows is a structurally capped, support-heavy model. The realistic ceiling is ~$3k/mo with ongoing maintenance (FACT). Keep 1–2 SKUs (MeetCore, KnowCore) live as top-of-funnel lead magnets, not as the business.

**Why Forge wins:** it is the only asset that (a) already works on real data, (b) sits in a large growing market, (c) has a defensible niche the horizontal tools ignore (local SMB + offer-specific scoring), and (d) *feeds its own GTM* — Forge's output is the prospect list for selling Forge.

---

## Build-to-sell plan — Forge

### Positioning

- **One-line promise:** *Find the local businesses that need your offer — scored, verified, and ready to contact this week.*
- **ICP:** marketing/automation agencies and B2B service SMBs (5–50 staff) running local outbound; secondary: solo consultants selling a single offer into a defined geography.
- **Wedge:** offer-specific scoring. You don't get a generic list — you get businesses ranked by how badly they need *your specific product*, with a per-lead sale angle.
- **Top-3 differentiators:** (1) scored *for your offer*, not generic firmographics; (2) every lead ships with a one-line problem and a 2–3 sentence sale strategy; (3) verified contactability (format + reachability + enrichment) before it reaches you.

Brand-voice copy (Curcible system):
- ✓ Returns scored, verified local leads in under five minutes.
- ✓ Ranks each business by fit to your specific offer.
- ✓ Ships a sale angle with every lead.

### Offer & pricing (benchmarked to live comps)

Benchmarks (FACT, 2026): Apollo $59–$149/seat/mo · Clay $185 (Launch) / $495 (Growth) · Instantly from $30/mo · AI SDR retainers $6k–$12k/mo · AI SDR platforms $500–$5,000/mo.

| Tier | Price | What | Position |
|---|---|---|---|
| **Self-serve** | **$49/mo** | Run the pipeline, bring your own LLM key, 1,000 scored leads/mo, CSV export | Undercuts Apollo entry, above Instantly |
| **Pro** | **$149/mo** | Managed keys (no setup), 5,000 leads/mo, enrichment included, saved searches | Matches Apollo Pro, below Clay Launch |
| **Done-with-you** | **$1,500/mo** | We run targeted lists weekly + wire one Core workflow (e.g. outreach) for the client | Far below $6k AI-SDR retainer; high margin |

**INFERENCE:** Lead with **Done-with-you** for first revenue (1 sale = $1,500 MRR, no self-serve infra needed), build self-serve in parallel.

### MVP scope

**Build / finish:**
1. Route **all** LLM + enrichment calls through `forge-leads.mjs` (server-side keys). [exists — wire the UI to it]
2. Remove or gate the **LLM-only "invented leads"** path for paid use; Places-mode (real businesses) only.
3. Replace **Google-Places-resale** path: either (a) deliver leads *as a managed service output* (allowed — you act on data, don't resell raw cached Places content), or (b) source from a licensable provider. Add ToS/privacy policy.
4. **Accuracy benchmark**: 100-lead sample vs. Apollo, publish hit-rate.
5. Billing (Stripe) + 3 tiers + gated auth (replace `localStorage.forge_session = '1'`).

**Explicit cut list (do NOT build now):** Pulse, Broadcast, voice agents, the 6 weak Core SKUs as paid products, the ScrapeGraphAI Python backend in the README.

**Build sequence:** server-side keys → kill hallucination mode → compliance/ToS → benchmark → billing → self-serve gate.

### Proof assets

- **Demo:** 90-sec Loom — enter "Texas / HVAC / InboxCore," show scored verified sheet + sale angles.
- **First case study:** run Forge for one friendly agency, hand them 50 hot leads, get a "we booked N meetings" quote with a number.
- **Guarantee:** "If fewer than 70% of delivered hot leads are real, reachable businesses, the month is free." (Forces the accuracy fix; removes buyer risk.)

### GTM

- **Channel 1 (primary): Forge dogfood outbound.** Use Forge to find marketing/automation agencies, score them for "needs better lead lists," send the sale angle Forge generates. The product is the demo.
- **Channel 2: founder-led content** — post the accuracy benchmark and one teardown ("how we scored 200 HVAC firms in Texas") to LinkedIn + r/automation/n8n communities.
- **First-100-customers motion:** 20 done-with-you outreach/week from Forge's own output → land 5–10 done-with-you clients ($1.5k each) → reinvest into self-serve launch → convert content audience to $49/$149 tiers.
- **Outreach assets:** Forge-generated per-lead angle as the cold-email body; benchmark PDF as the lead magnet; Loom as the reply asset.

### Funnel & 3 key metrics

Funnel: content/outbound → free sample (10 scored leads) → paid tier or done-with-you call.

1. **Lead accuracy rate** (real + reachable / delivered) — north-star, gates the guarantee. Target ≥80%.
2. **Sample → paid conversion** — target ≥15% on the 10-lead free sample.
3. **MRR + logo churn** — target $5k MRR by day 90, churn <8%/mo.

### 30 / 60 / 90 plan

**Days 1–30 (fix + first dollar):**
- Wk1: server-side keys; kill hallucination mode; ToS/privacy page.
- Wk2: 100-lead accuracy benchmark; record demo Loom.
- Wk3: Stripe + 3 tiers + auth gate; "done-with-you" one-pager.
- Wk4: 20 outbound/wk from Forge output → **first done-with-you client ($1.5k).**

**Days 31–60 (proof + self-serve):**
- Wk5–6: deliver client list, capture case-study number.
- Wk7: launch self-serve $49/$149 with managed keys.
- Wk8: publish benchmark + teardown; open free-sample funnel. Target: 3 paying logos.

**Days 61–90 (scale the motion):**
- Wk9–10: 2nd done-with-you client; wire one Core workflow (outreach/Broadcast) as the upsell.
- Wk11: optimize sample→paid conversion; add saved searches.
- Wk12: **target $5k MRR**, churn <8%, accuracy ≥80% verified.

### Risks & kill criteria

- **Risk:** Google ToS enforcement on data delivery → mitigate by selling *managed output/service*, not raw Places exports; move to licensed source if scaling self-serve.
- **Risk:** accuracy below promise → the guarantee makes this existential; benchmark before any paid sale.
- **Risk:** horizontal incumbents (Apollo/Clay) add local-SMB scoring → defend with done-with-you service depth, not features.
- **Kill criteria:** if after 60 days accuracy can't clear 70% on real samples, OR sample→paid conversion <5%, OR no done-with-you client closes from 60+ outbound — stop, and pivot the engine to internal use only while testing the voice-agent Phase 2.

---

## Sources (dated, linked)

- n8n template selling $29–$299, marketplace 850+ templates — [n8nmarkets.com](https://www.n8nmarkets.com/en/), [browseract, 2026](https://www.browseract.com/blog/how-to-make-money-with-n8n-workflow-automation)
- n8n community library 10,000+ workflows, 1,478 sales — [n8n.io/workflows](https://n8n.io/workflows/), [n8n.io sales](https://n8n.io/workflows/categories/sales/)
- One-time template realistic ceiling ~$3,200/mo w/ maintenance — [Medium, 2026](https://medium.com/write-a-catalyst/i-built-5-n8n-automations-that-generate-3-200-month-passively-72e2a3050e17)
- Gumroad buyers expect tested/documented/supported tools, $19–$79 — [digitalapplied.com, 2026](https://www.digitalapplied.com/blog/ai-digital-products-templates-workflows-sell-guide), [conversionproplus, 2026](https://conversionproplus.com/blog/gumroad-trends-2026-what-s-selling-right-now)
- Clay $185/$495, Apollo $59/$99/$149, Instantly from $30 — [devcommx, 2026](https://www.devcommx.com/blogs/clay-vs-apollo-vs-instantly-comparison), [devcommx Clay pricing, 2026](https://www.devcommx.com/blogs/clay-pricing-breakdown)
- AI SDR market $4.27B (2025) → $5.22B (2026), 21.2% CAGR; retainers $6k–$12k/mo; platforms $500–$5k/mo; churn 50–70% — [Fortune Business Insights](https://www.fortunebusinessinsights.com/ai-sdr-market-114112), [devcommx AI SDR stats, 2026](https://www.devcommx.com/blogs/ai-sdr-statistics)
- AI voice agents $2.54B (2025) → $35.24B (2033), 39% CAGR; SMB AI adoption 39%→55% — [Grand View Research, 2026](https://www.grandviewresearch.com/industry-analysis/ai-voice-agents-market-report), [getnextphone stats, 2026](https://www.getnextphone.com/blog/ai-receptionist-statistics)
- Voice agent all-in cost $0.13–$0.31/min; white-label Synthflow $1,250/mo — [Retell AI pricing, 2026](https://www.retellai.com/blog/ai-voice-agent-pricing-full-cost-breakdown-platform-comparison-roi-analysis), [Famulor, 2026](https://www.famulor.io/blog/ai-voice-agent-pricing-2026-what-10-platforms-actually-cost-per-minute)
- Google Places: content except place IDs cannot be cached/stored; reselling violates ToS — [Google Places policies](https://developers.google.com/maps/documentation/places/web-service/policies), [Google Maps Platform ToS](https://cloud.google.com/maps-platform/terms), [Scrap.io, 2026](https://scrap.io/scrape-google-gaps-legal)

---

## Next 3 actions this week

1. **Close the credibility gap.** Pick ONE product taxonomy and make `Curcible_Products_Reference.md`, `catalog.js`, `products.js`, and `forge-leads.mjs` agree; rewrite Core marketing to match the JSON actually shipped (or pull the misaligned SKUs from sale).
2. **Make Forge lawful and secure to sell.** Route all keys/LLM calls through `forge-leads.mjs` (server-side), disable the LLM-only invented-leads path for any paid use, and add a ToS/privacy page; reframe delivery as managed service output, not raw Places resale.
3. **Run the accuracy benchmark + record the demo.** 100 real leads vs. Apollo, publish the hit-rate, cut the 90-sec Loom — these unlock the guarantee, the first done-with-you sale, and the funnel.
