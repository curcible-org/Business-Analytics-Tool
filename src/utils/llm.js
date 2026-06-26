import { PROVIDERS } from '../config/providers.js'
import { BLUEPRINT_PRODUCTS } from '../config/products.js'

// Shared parser — strips markdown fences, extracts JSON array, tolerant of
// trailing junk and a single truncated final object.
function parseLeadsArray(txt) {
  if (typeof txt !== 'string') throw new Error('Model returned no text.')
  const clean = txt.replace(/```json|```/gi, '').trim()
  const s = clean.indexOf('[')
  const e = clean.lastIndexOf(']')
  if (s === -1 || e === -1)
    throw new Error('Model did not return a JSON array.')
  const slice = clean.slice(s, e + 1)
  try {
    return JSON.parse(slice)
  } catch {
    // Salvage: keep only complete top-level objects, drop a trailing partial one.
    const repaired = salvageArray(slice)
    if (repaired) return repaired
    throw new Error('Model returned malformed JSON.')
  }
}

// Best-effort recovery of an array of objects from a partially-valid string.
function salvageArray(slice) {
  const objs = []
  let depth = 0, start = -1, inStr = false, esc = false
  for (let i = 0; i < slice.length; i++) {
    const ch = slice[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') { inStr = true; continue }
    if (ch === '{') { if (depth === 0) start = i; depth++ }
    else if (ch === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        try { objs.push(JSON.parse(slice.slice(start, i + 1))) } catch {}
        start = -1
      }
    }
  }
  return objs.length ? objs : null
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Single provider call. No multi-provider fallback (the app holds one key);
// instead retries the same provider on transient failure / malformed output.
async function callProvider({ p, model, apiKey, systemPrompt, userPrompt, temperature }) {
  const body = p.fmt === 'anthropic'
    ? { model, max_tokens: 8000, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }
    : { model, max_tokens: 8000, temperature, messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ] }

  const res = await fetch(p.url, { method: 'POST', headers: p.headers(apiKey), body: JSON.stringify(body) })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = new Error(d.error?.message || `HTTP ${res.status}`)
    e.retryable = res.status === 429 || res.status >= 500
    throw e
  }
  const raw = p.fmt === 'anthropic' ? d.content?.[0]?.text : d.choices?.[0]?.message?.content
  const usage = p.fmt === 'anthropic'
    ? { totalTokens: (d.usage?.input_tokens || 0) + (d.usage?.output_tokens || 0) }
    : { totalTokens: d.usage?.total_tokens || 0 }
  return { leads: parseLeadsArray(raw), usage }
}

async function callWithRetry(args, attempts = 3) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await callProvider(args)
    } catch (e) {
      lastErr = e
      // Retry transient HTTP and malformed-JSON errors; fail fast on auth/4xx.
      const retryable = e.retryable || /malformed|did not return/i.test(e.message)
      if (!retryable || i === attempts - 1) break
      await sleep(800 * (i + 1))
    }
  }
  throw lastErr
}

// ─── Score real Places leads with the LLM ────────────────────────────────────
// Takes raw Place leads (name, address, phone, website, industry, notes) and
// asks the LLM to add score / pain_points / sale_strategy / etc.
// Returns { leads: scored[], usage }. Leads are merged back by places_id so a
// model that renames a business can't mis-attach scores.

export async function scorePlacesLeads({ leads, providerKey, model, targetProduct, apiKey }) {
  const tp = BLUEPRINT_PRODUCTS.find(p => p.id === targetProduct) || BLUEPRINT_PRODUCTS[0]
  const p  = PROVIDERS[providerKey]

  const businessList = leads
    .map((l, i) => [
      `${i + 1}. [ref:${l.places_id || i}] ${l.name}`,
      `   Address: ${l.address}`,
      `   Phone:   ${l.phone || 'unknown'}`,
      `   Website: ${l.website || 'none'}`,
      `   Industry tags: ${l.industry || 'unknown'}`,
      `   ${l.notes || ''}`,
    ].join('\n'))
    .join('\n\n')

  const systemPrompt = `You are a lead intelligence engine. Output ONLY a raw JSON array — no markdown, no backticks, no preamble.`

  const userPrompt = `Analyze these REAL businesses from Google Places and score them as prospects for selling: ${tp.name} — ${tp.desc}

Product: ${tp.name} (${tp.id}) · ${tp.desc}

All 8 Blueprint products:
${BLUEPRINT_PRODUCTS.map(prod => `${prod.id} — ${prod.name}: ${prod.desc}`).join('\n')}

${leads.length} real businesses to score:

${businessList}

Return a JSON array with one object per business IN THE SAME ORDER. Each object must have ALL fields:
{
  "ref": "the [ref:...] value for this business, copied exactly",
  "score": "hot" | "warm" | "low",
  "buy_probability": integer 0-100,
  "industry": "concise industry label (e.g. HVAC, Hair Salon, Law Firm)",
  "website_quality": "one sentence on their web presence — use website field above",
  "services": ["service1","service2"],
  "tech_stack": ["Wix"] or [],
  "pain_points": ["pain1","pain2"],
  "problem_solved": "one sentence: the specific business problem this lead has that ${tp.name} directly solves",
  "sale_strategy": "2-3 sentences: entry point, positioning angle, expected close",
  "recommended_products": ["${tp.id}"],
  "social_only": false,
  "notes": "one line of context"
}

Scoring:
- hot  → no website OR broken/outdated site, active business, strong pain-point match
- warm → basic site, clear room for improvement
- low  → marginal opportunity

buy_probability: hot=70-95, warm=40-69, low=15-39

Return ONLY the JSON array. No markdown, no explanation.`

  const { leads: scored, usage } = await callWithRetry({
    p, model, apiKey, systemPrompt, userPrompt, temperature: 0.5,
  })

  // Merge scored fields onto original place data, matched by ref (places_id),
  // then index fallback. Never overwrites the authoritative Places fields.
  const byRef = new Map()
  scored.forEach((s, i) => {
    const key = s.ref != null ? String(s.ref) : null
    if (key) byRef.set(key, s)
    byRef.set(`__idx_${i}`, s)
  })

  const merged = leads.map((place, i) => {
    const match =
      byRef.get(String(place.places_id)) ||
      byRef.get(`__idx_${i}`) ||
      {}
    const { ref, name, address, phone, website, ...scoreFields } = match
    return { ...place, ...scoreFields }
  })

  return { leads: merged, usage }
}
