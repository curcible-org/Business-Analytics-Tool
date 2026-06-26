# Forge — Getting Your Keys (Google Places + LLM)

Two keys make the hosted API run on real data: a **Google Places** key (the lead source) and an **LLM** key (the scoring engine). Both are held server-side in Netlify env — never in the browser. Budget ~15 minutes.

---

## 1. Google Places API key (the lead source)

Forge uses **Places API (New) — Text Search**. Google gives a recurring credit that covers thousands of searches/month, but billing must be enabled on the project (card required, not charged under the credit).

1. Go to the Google Cloud Console → console.cloud.google.com.
2. Create a project (top bar → project dropdown → New Project). Name it e.g. `curcible-forge`.
3. Enable billing: left menu → Billing → link a billing account (add a card). The free credit applies automatically; you are not charged under it.
4. Enable the API: left menu → APIs & Services → Library → search **"Places API (New)"** → Enable. (Make sure it is the *New* one, not the legacy "Places API".)
5. Create the key: APIs & Services → Credentials → Create credentials → API key. Copy it.
6. Restrict the key (recommended): click the key → API restrictions → "Restrict key" → select **Places API (New)** → Save. Since the key lives server-side, you do not need HTTP-referrer restrictions.

**Where it goes:** Netlify env var `FORGE_PLACES_KEY`. (You can also paste it into the app's Settings to test the in-browser run mode, but the hosted API only reads the env var.)

Sanity check (optional, from your terminal):
```
curl -s -X POST 'https://places.googleapis.com/v1/places:searchText' \
  -H 'Content-Type: application/json' \
  -H 'X-Goog-Api-Key: YOUR_PLACES_KEY' \
  -H 'X-Goog-FieldMask: places.id,places.displayName' \
  -d '{"textQuery":"plumbers in Austin, Texas","maxResultCount":3}'
```
Expect a JSON list of 3 places. A `403`/`PERMISSION_DENIED` means billing or the API enablement is missing.

---

## 2. LLM key (the scoring engine)

Any one provider works. **Groq is the easiest** — free, fast, no card.

**Groq (recommended)**
1. Go to console.groq.com → sign in.
2. API Keys → Create API Key → copy it.
3. Env:
   - `FORGE_LLM_PROVIDER=groq`
   - `FORGE_LLM_MODEL=llama-3.3-70b-versatile`
   - `FORGE_LLM_KEY=<your groq key>`

**Alternatives** (same `FORGE_LLM_KEY` slot, different provider/model):
| Provider | `FORGE_LLM_PROVIDER` | A good `FORGE_LLM_MODEL` | Notes |
|---|---|---|---|
| Google AI Studio | `google` | `gemini-2.0-flash` | free, 500 req/day, aistudio.google.com |
| Cerebras | `cerebras` | `llama3.3-70b` | free, very fast |
| OpenRouter | `openrouter` | `meta-llama/llama-3.3-70b-instruct:free` | free tier, 50 req/day |
| Anthropic | `anthropic` | `claude-haiku-4-5-20251001` | paid, highest quality |

---

## 3. Paste into Netlify

Site → Site settings → Environment variables. Minimum to run on real data:

```
SUPABASE_URL=https://rjgeedzpqcbylgnxwxml.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<copy from Supabase → Project Settings → API → service_role>
FORGE_PLACES_KEY=<your Google Places key>
FORGE_LLM_PROVIDER=groq
FORGE_LLM_MODEL=llama-3.3-70b-versatile
FORGE_LLM_KEY=<your Groq key>
FORGE_ALLOWED_ORIGINS=https://forge-lead-intelligence.netlify.app
```
Optional enrichment (improves email/phone columns): `FORGE_HUNTER_KEY`, `FORGE_ABSTRACT_EMAIL_KEY`, `FORGE_ABSTRACT_PHONE_KEY`.

Then trigger a deploy. Smoke test (uses your seeded tenant key):
```
curl -s https://forge-lead-intelligence.netlify.app/api/v1/leads \
  -H "Authorization: Bearer <YOUR_TENANT_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"state":"Texas","country":"United States","product":"P08"}'
```
Expect `ok:true`, `meta.source:"google_places"`, and ToS-safe leads (no name/address; `place_id` + `maps_url` + intelligence).
