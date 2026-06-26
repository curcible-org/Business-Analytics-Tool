/**
 * Curcible Forge — Lead Intelligence API
 * POST /.netlify/functions/forge-leads  ->  /api/v1/leads
 *
 * Auth (per-tenant, when Supabase is configured):
 *   Authorization: Bearer <tenant_api_key>
 * Falls back to a single FORGE_API_KEY only if Supabase env is absent.
 *
 * Keys are SERVER-HELD. Callers never send LLM/Places/enrichment keys — the
 * function uses keys from Netlify env. The pipeline is Places-backed (real
 * businesses only); it never asks an LLM to invent leads. Output is ToS-safe:
 * no raw Places content beyond place_id + a place_id Maps link.
 *
 * Required env for a live run:
 *   FORGE_PLACES_KEY            Google Places API (New) key
 *   FORGE_LLM_KEY              LLM provider key
 *   FORGE_LLM_PROVIDER         groq | google | openrouter | cerebras | anthropic (default groq)
 *   FORGE_LLM_MODEL            model id (default llama-3.3-70b-versatile)
 * Optional: FORGE_HUNTER_KEY, FORGE_ABSTRACT_EMAIL_KEY, FORGE_ABSTRACT_PHONE_KEY
 *           FORGE_ALLOWED_ORIGINS (comma-separated; default '*')
 *           SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (enables per-tenant auth)
 *           FORGE_API_KEY (legacy single-key fallback)
 */

import { parsePhoneNumber } from 'libphonenumber-js'
import validator from 'validator'
import { authorize, supabaseConfigured } from './_shared/forgeAuth.mjs'

// ─── CORS (scoped) ──────────────────────────────────────────────────────────
function corsHeaders(origin) {
  const allowed = (process.env.FORGE_ALLOWED_ORIGINS || '*').split(',').map(s => s.trim())
  const allowAll = allowed.includes('*')
  const allowOrigin = allowAll ? '*' : (allowed.includes(origin) ? origin : allowed[0] || 'null')
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
}
const json = (statusCode, body, origin) => ({ statusCode, headers: corsHeaders(origin), body: JSON.stringify(body) })
const err  = (statusCode, error, origin, details) => json(statusCode, { ok: false, error, ...(details ? { details } : {}) }, origin)

// ─── Products ────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: 'P01', name: 'InboxCore', desc: 'AI Email Triage & Auto-Reply' },
  { id: 'P02', name: 'ContentCore', desc: 'Auto SEO Blog Writer' },
  { id: 'P03', name: 'LeadCore', desc: 'AI Lead Qualification & CRM Push' },
  { id: 'P04', name: 'PostCore', desc: 'Social Media Auto-Publisher' },
  { id: 'P05', name: 'ReportCore', desc: 'Weekly Analytics Digest' },
  { id: 'P06', name: 'KnowCore', desc: 'WhatsApp AI Chatbot + RAG' },
  { id: 'P07', name: 'MeetCore', desc: 'AI Meeting Summary & Follow-Up' },
  { id: 'P08', name: 'SchedCore', desc: 'AI Scheduling & Booking Automation' },
]
const PRODUCT_LIST = PRODUCTS.map(p => `${p.id} — ${p.name}: ${p.desc}`).join('\n')

const PRODUCT_QUERY_MAP = {
  P01: 'small businesses in', P02: 'local service companies in',
  P03: 'marketing agencies in', P04: 'restaurants and retail stores in',
  P05: 'staffing and hospitality businesses in', P06: 'customer service businesses in',
  P07: 'professional services firms in', P08: 'digital marketing companies in',
}

const LLM_PROVIDERS = {
  groq:       { url: 'https://api.groq.com/openai/v1/chat/completions', fmt: 'openai',
                headers: k => ({ Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' }) },
  google:     { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', fmt: 'openai',
                headers: k => ({ Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' }) },
  openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', fmt: 'openai',
                headers: k => ({ Authorization: `Bearer ${k}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://curcible.com', 'X-Title': 'Curcible Forge API' }) },
  cerebras:   { url: 'https://api.cerebras.ai/v1/chat/completions', fmt: 'openai',
                headers: k => ({ Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' }) },
  anthropic:  { url: 'https://api.anthropic.com/v1/messages', fmt: 'anthropic',
                headers: k => ({ 'x-api-key': k, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }) },
}

// ─── Google Places discovery (real source) ────────────────────────────────────
const FIELD_MASK = [
  'places.id','places.displayName','places.formattedAddress',
  'places.nationalPhoneNumber','places.internationalPhoneNumber',
  'places.websiteUri','places.businessStatus','places.types',
  'places.rating','places.userRatingCount',
].join(',')

function inferIndustry(types = []) {
  const priority = ['restaurant','cafe','bar','lodging','gym','fitness_center','hair_care','beauty_salon','dentist','doctor','hospital','pharmacy','lawyer','accounting','real_estate_agency','insurance_agency','car_repair','electrician','plumber','contractor','roofing_contractor','marketing_agency','staffing_agency']
  for (const t of priority) if (types.includes(t)) return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const skip = new Set(['establishment','point_of_interest','food','store','health','finance'])
  const first = types.find(t => !skip.has(t))
  return first ? first.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Local Business'
}

async function searchPlaces({ state, country, product, placesKey }) {
  const prefix = PRODUCT_QUERY_MAP[product] || 'local businesses in'
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': placesKey, 'X-Goog-FieldMask': FIELD_MASK },
    body: JSON.stringify({ textQuery: `${prefix} ${state}, ${country}`, maxResultCount: 20, languageCode: 'en' }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(`Google Places: ${e?.error?.message || `HTTP ${res.status}`}`)
  }
  const data = await res.json()
  const active = (data.places || []).filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY' && p.businessStatus !== 'CLOSED_TEMPORARILY')
  return active.map(p => ({
    name: p.displayName?.text || 'Unknown Business',
    address: p.formattedAddress || '',
    phone: p.nationalPhoneNumber || p.internationalPhoneNumber || null,
    website: p.websiteUri ? p.websiteUri.replace(/\/$/, '') : null,
    email: null,
    industry: inferIndustry(p.types || []),
    places_id: p.id,
    notes: p.rating ? `Google Places: ${p.rating}★ (${p.userRatingCount || 0} reviews)` : 'Google Places listing',
  }))
}

// ─── LLM scoring (retry + tolerant parse) ─────────────────────────────────────
function parseLeadsArray(txt) {
  if (typeof txt !== 'string') throw new Error('Model returned no text.')
  const clean = txt.replace(/```json|```/gi, '').trim()
  const s = clean.indexOf('['), e = clean.lastIndexOf(']')
  if (s === -1 || e === -1) throw new Error('Model did not return a JSON array.')
  try { return JSON.parse(clean.slice(s, e + 1)) }
  catch {
    const objs = []
    const m = clean.slice(s, e + 1).match(/\{[^{}]*\}/g) || []
    for (const o of m) { try { objs.push(JSON.parse(o)) } catch {} }
    if (objs.length) return objs
    throw new Error('Model returned malformed JSON.')
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function scorePlacesLeads({ leads, provider, model, llmKey }) {
  const p = LLM_PROVIDERS[provider]
  const businessList = leads.map((l, i) =>
    `${i + 1}. [ref:${l.places_id || i}] ${l.name}\n   Address: ${l.address}\n   Phone: ${l.phone || 'unknown'}\n   Website: ${l.website || 'none'}\n   Industry: ${l.industry || 'unknown'}`
  ).join('\n\n')

  const system = 'You are a lead intelligence engine. Output ONLY a raw JSON array — no markdown, no backticks, no preamble.'
  const user = `Score these REAL businesses from Google Places as prospects for Curcible Blueprint products.

All products:
${PRODUCT_LIST}

${leads.length} businesses:

${businessList}

Return a JSON array, one object per business IN THE SAME ORDER, each with ALL fields:
{"ref":"the [ref:...] value copied exactly","score":"hot|warm|low","buy_probability":0-100,"industry":"label","website_quality":"one sentence","services":["s1"],"tech_stack":[],"pain_points":["p1"],"problem_solved":"one sentence","sale_strategy":"2-3 sentences","recommended_products":["P01"],"notes":"one line"}

Scoring: hot=no/broken site+strong match (70-95), warm=basic site (40-69), low=marginal (15-39). Return ONLY the JSON array.`

  let raw, usage = { totalTokens: 0 }, lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const body = p.fmt === 'anthropic'
        ? { model, max_tokens: 8000, system, messages: [{ role: 'user', content: user }] }
        : { model, max_tokens: 8000, temperature: 0.5, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }
      const res = await fetch(p.url, { method: 'POST', headers: p.headers(llmKey), body: JSON.stringify(body) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { const e = new Error(d.error?.message || `LLM HTTP ${res.status}`); e.retryable = res.status === 429 || res.status >= 500; throw e }
      raw = p.fmt === 'anthropic' ? d.content?.[0]?.text : d.choices?.[0]?.message?.content
      usage = p.fmt === 'anthropic'
        ? { totalTokens: (d.usage?.input_tokens || 0) + (d.usage?.output_tokens || 0) }
        : { totalTokens: d.usage?.total_tokens || 0 }
      const scored = parseLeadsArray(raw)
      const byRef = new Map()
      scored.forEach((s, i) => { if (s.ref != null) byRef.set(String(s.ref), s); byRef.set(`__idx_${i}`, s) })
      const merged = leads.map((place, i) => {
        const match = byRef.get(String(place.places_id)) || byRef.get(`__idx_${i}`) || {}
        const { ref, name, address, phone, website, ...sf } = match
        return { ...place, ...sf }
      })
      return { leads: merged, usage }
    } catch (e) {
      lastErr = e
      const retry = e.retryable || /malformed|did not return/i.test(e.message)
      if (!retry || attempt === 2) break
      await sleep(800 * (attempt + 1))
    }
  }
  throw lastErr
}

// ─── Validation / enrichment / reachability ───────────────────────────────────
function extractDomain(url) {
  if (!url) return null
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase() }
  catch { return null }
}

function runFormatValidation(leads) {
  return leads.map(lead => {
    let phone_valid = false, phone_type = 'UNKNOWN', phone_formatted = lead.phone
    try { const ph = parsePhoneNumber(lead.phone || '', 'US'); phone_valid = ph.isValid(); phone_type = ph.getType() || 'UNKNOWN'; phone_formatted = ph.formatInternational() } catch {}
    return {
      ...lead,
      phone_valid, phone_type, phone_formatted,
      email_format_valid: lead.email ? validator.isEmail(String(lead.email)) : false,
      url_format_valid: lead.website ? validator.isURL(String(lead.website), { require_protocol: true, protocols: ['http','https'] }) : false,
    }
  })
}

async function enrichWithHunter(leads, apiKey, budget = 25) {
  if (!apiKey?.trim() || budget <= 0) return leads
  let used = 0
  const updates = new Map()
  for (const lead of leads) {
    if (used >= budget) break
    if (lead.score === 'low' || !lead.website || (lead.email && lead.email_format_valid)) continue
    const domain = extractDomain(lead.website)
    if (!domain) continue
    try {
      const res = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=5`)
      used++
      if (res.ok) {
        const d = await res.json()
        const emails = d?.data?.emails || []
        if (emails.length) {
          const best = [...emails].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
          updates.set(lead.places_id, { email: best.value, email_source: 'hunter', email_confidence: best.confidence, email_format_valid: true })
        }
      }
    } catch { used++ }
  }
  return leads.map(l => { const p = updates.get(l.places_id); return p ? { ...l, ...p } : l })
}

async function enrichWithAbstract(leads, emailKey, phoneKey) {
  const hasEmail = !!emailKey?.trim(), hasPhone = !!phoneKey?.trim()
  if (!hasEmail && !hasPhone) return leads
  const candidates = leads.filter(l => l.score === 'hot').slice(0, 3)
  const updates = new Map()
  for (const lead of candidates) {
    const patch = {}
    if (hasEmail && lead.email && lead.email_format_valid) {
      try { const res = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${emailKey}&email=${encodeURIComponent(lead.email)}`)
        if (res.ok) { const d = await res.json(); patch.email_deliverable = d.deliverability === 'DELIVERABLE'; patch.email_smtp_valid = d.is_smtp_valid?.value === true } } catch {}
      await sleep(1100)
    }
    if (hasPhone && lead.phone && lead.phone_valid) {
      try { const res = await fetch(`https://phonevalidation.abstractapi.com/v1/?api_key=${phoneKey}&phone=${encodeURIComponent(lead.phone)}`)
        if (res.ok) { const d = await res.json(); if (d.type) patch.phone_type = d.type.toUpperCase(); if (d.carrier) patch.phone_carrier = d.carrier } } catch {}
      await sleep(1100)
    }
    if (Object.keys(patch).length) updates.set(lead.places_id, patch)
  }
  return leads.map(l => { const p = updates.get(l.places_id); return p ? { ...l, ...p } : l })
}

// Reachability: only 2xx and 3xx count as reachable. 4xx/5xx (incl. 404/parked) do not.
async function checkWebsite(url) {
  try {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 6000)
    const res = await fetch(url, { method: 'HEAD', signal: ac.signal, redirect: 'follow' })
    clearTimeout(t)
    return res.status >= 200 && res.status < 400
  } catch { return false }
}

async function verifyReachability(leads) {
  return Promise.all(leads.map(async lead => {
    const web_verified = lead.website && lead.url_format_valid ? await checkWebsite(lead.website) : lead.website ? false : null
    const maps_url = lead.places_id ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(lead.places_id)}` : ''
    return { ...lead, web_verified, maps_url }
  }))
}

function computeConfidence(l) {
  let s = 0
  if (l.web_verified === true) s++
  if (l.phone_valid === true) s++
  if (l.email_format_valid === true) s++
  if (l.email_source === 'hunter') s++
  if (l.email_deliverable === true) s++
  return s
}

// ToS-safe serialization — no raw Places content beyond place_id + maps link.
function toSafeLead(l) {
  return {
    place_id: l.places_id,
    maps_url: l.maps_url,
    industry: l.industry,
    score: l.score,
    buy_probability: l.buy_probability,
    pain_points: l.pain_points || [],
    problem_solved: l.problem_solved,
    sale_strategy: l.sale_strategy,
    recommended_products: l.recommended_products || [],
    website_quality: l.website_quality,
    email: l.email_source === 'hunter' ? l.email : null,
    email_source: l.email_source === 'hunter' ? 'hunter' : null,
    email_deliverable: l.email_deliverable ?? null,
    web_reachable: l.web_verified,
    confidence: l.confidence,
    compliance_note: 'Outreach must include sender identity + a working opt-out (CAN-SPAM / GDPR).',
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || ''
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(origin) }
  if (event.httpMethod !== 'POST') return err(405, 'Method not allowed. Use POST.', origin)

  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  const ip = event.headers?.['x-nf-client-connection-ip'] || event.headers?.['x-forwarded-for'] || null

  // Per-tenant auth when Supabase is configured; otherwise legacy single key.
  if (supabaseConfigured()) {
    const a = await authorize({ token, endpoint: 'leads', ip })
    if (!a.ok) return err(a.status, `Unauthorized (${a.reason}).`, origin)
  } else {
    const legacy = process.env.FORGE_API_KEY
    if (!legacy) return err(500, 'Server not configured: set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (per-tenant) or FORGE_API_KEY (legacy).', origin)
    if (!token || token !== legacy) return err(401, 'Unauthorized. Provide a valid Bearer token.', origin)
  }

  // Server-held keys — callers never send provider keys.
  const placesKey = process.env.FORGE_PLACES_KEY
  const llmKey    = process.env.FORGE_LLM_KEY
  const provider  = process.env.FORGE_LLM_PROVIDER || 'groq'
  const model     = process.env.FORGE_LLM_MODEL || 'llama-3.3-70b-versatile'
  if (!placesKey) return err(500, 'Server not configured: FORGE_PLACES_KEY missing (Places is the only lead source).', origin)
  if (!llmKey)    return err(500, 'Server not configured: FORGE_LLM_KEY missing.', origin)
  if (!LLM_PROVIDERS[provider]) return err(500, `Invalid FORGE_LLM_PROVIDER: ${provider}.`, origin)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return err(400, 'Invalid JSON body.', origin) }
  const { state, country, product } = body
  const missing = []
  if (!state?.trim()) missing.push('state')
  if (!country?.trim()) missing.push('country')
  if (!product) missing.push('product')
  if (missing.length) return err(400, 'Missing required fields.', origin, { missing })
  if (!PRODUCTS.find(p => p.id === product)) return err(400, `Invalid product. One of: ${PRODUCTS.map(p => p.id).join(', ')}`, origin)

  try {
    const places = await searchPlaces({ state, country, product, placesKey })
    if (!places.length) return json(200, { ok: true, meta: { state, country, product, discovered: 0, qualified: 0 }, leads: [] }, origin)

    const { leads: scored, usage } = await scorePlacesLeads({ leads: places, provider, model, llmKey })
    let leads = runFormatValidation(scored)
    leads = await enrichWithHunter(leads, process.env.FORGE_HUNTER_KEY, 25)
    leads = await enrichWithAbstract(leads, process.env.FORGE_ABSTRACT_EMAIL_KEY, process.env.FORGE_ABSTRACT_PHONE_KEY)
    leads = leads.map(l => ({ ...l, confidence: computeConfidence(l) }))
    leads = await verifyReachability(leads)

    const qualified = leads.filter(l => l.score === 'hot' && l.web_verified === true).map(toSafeLead)

    return json(200, {
      ok: true,
      meta: { state, country, product, discovered: places.length, qualified: qualified.length, tokens: usage.totalTokens, source: 'google_places', note: 'ToS-safe: place_id + intelligence only; resolve live business details via maps_url.' },
      leads: qualified,
    }, origin)
  } catch (e) {
    return err(500, 'Pipeline error.', origin, { message: e.message })
  }
}
