/**
 * Curcible Forge — Lead Intelligence API
 * POST /.netlify/functions/forge-leads  →  /api/v1/leads
 *
 * Auth:  Authorization: Bearer <FORGE_API_KEY>   (set in Netlify env)
 * Body:  application/json  (see schema below)
 */

import { parsePhoneNumber } from 'libphonenumber-js'
import validator from 'validator'

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const json = (statusCode, body) => ({
  statusCode,
  headers: CORS,
  body: JSON.stringify(body),
})

const err = (statusCode, error, details) =>
  json(statusCode, { ok: false, error, ...(details ? { details } : {}) })

// ─── Blueprint Products ────────────────────────────────────────────────────────

const PRODUCTS = [
  { id: 'P01', name: 'InboxCore™',   desc: 'AI Email Autoresponder with Approval' },
  { id: 'P02', name: 'ContentCore™', desc: 'Auto SEO Blog Writer' },
  { id: 'P03', name: 'LeadCore™',    desc: 'LinkedIn Leads Scraper & Enrichment' },
  { id: 'P04', name: 'SocialCore™',  desc: 'Auto-Post to 9 Social Platforms' },
  { id: 'P05', name: 'TalentCore™',  desc: 'AI HR Job Application Screener' },
  { id: 'P06', name: 'KnowCore™',    desc: 'WhatsApp AI Chatbot with RAG' },
  { id: 'P07', name: 'MeetCore™',    desc: 'AI Meeting Summary & Follow-Up' },
  { id: 'P08', name: 'TubeCore™',    desc: 'YouTube Video Summaries via Gemini' },
]

const PRODUCT_LIST = PRODUCTS.map(p => `${p.id} — ${p.name}: ${p.desc}`).join('\n')

const VALID_PROVIDERS = ['groq', 'google', 'openrouter', 'cerebras', 'anthropic']

// ─── LLM Provider Config ──────────────────────────────────────────────────────

const LLM_PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    fmt: 'openai',
    headers: k => ({ Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' }),
  },
  google: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    fmt: 'openai',
    headers: k => ({ Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' }),
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    fmt: 'openai',
    headers: k => ({
      Authorization: `Bearer ${k}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://curcible.com',
      'X-Title': 'Curcible Forge API',
    }),
  },
  cerebras: {
    url: 'https://api.cerebras.ai/v1/chat/completions',
    fmt: 'openai',
    headers: k => ({ Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' }),
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    fmt: 'anthropic',
    headers: k => ({
      'x-api-key': k,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }),
  },
}

// ─── LLM ──────────────────────────────────────────────────────────────────────

function buildPrompt(state, country, product) {
  const tp = PRODUCTS.find(p => p.id === product) || PRODUCTS[0]
  return `You are a lead intelligence engine finding real prospects for a specific product.

Target location: ${state}, ${country}
Product to sell: ${tp.name} — ${tp.desc}

Your task: identify business types in ${state}, ${country} that would genuinely benefit from "${tp.name}". Generate realistic leads for those businesses ONLY. Do NOT include businesses that already have strong coverage for this product or have no need for it. Omit any lead that would be a poor fit. Return between 10 and 20 leads — fewer is acceptable only if there are genuinely not enough relevant prospects.

All 8 Blueprint products (for recommended_products field):
${PRODUCT_LIST}

Return a JSON array. Every object must have ALL of these fields:
{
  "name": "Business Name",
  "address": "Street, City, ${state}, ${country}",
  "phone": "+1 (XXX) XXX-XXXX or null",
  "email": "contact@domain.com or null",
  "website": "https://... or null",
  "social_only": true or false,
  "industry": "Short industry label e.g. Fitness & Gym / Medical Clinic / Hair Salon",
  "score": "hot" | "warm" | "low",
  "buy_probability": integer 0-100,
  "website_quality": "One sentence on their web presence",
  "services": ["service1","service2"],
  "tech_stack": ["Wix"] or ["WordPress"] or [],
  "pain_points": ["pain1","pain2"],
  "problem_solved": "One sentence: the specific problem ${tp.name} solves for this business",
  "sale_strategy": "2-3 sentences: entry point, positioning angle, close — specific to this business",
  "recommended_products": ["P01","P04"],
  "notes": "One line of context"
}

Scoring rules:
- hot  → no/broken/outdated site, active business, strong pain-point match
- warm → basic site, clear improvement room, genuine opportunity
- low  → marginal but real match

buy_probability: hot → 70–95 · warm → 40–69 · low → 15–39

Do NOT include "skip" leads. Return ONLY the JSON array.`
}

function parseLeads(txt) {
  const clean = txt.replace(/```json|```/gi, '').trim()
  const s = clean.indexOf('[')
  const e = clean.lastIndexOf(']')
  if (s === -1 || e === -1) throw new Error('LLM did not return a JSON array.')
  return JSON.parse(clean.slice(s, e + 1))
}

async function callLLM({ providerKey, model, state, country, product, llmApiKey }) {
  const p = LLM_PROVIDERS[providerKey]
  const system = `You are a lead intelligence engine. Output ONLY a raw JSON array — no markdown, no backticks, no preamble.`
  const prompt = buildPrompt(state, country, product)

  let raw, usage = { totalTokens: 0 }

  if (p.fmt === 'anthropic') {
    const res = await fetch(p.url, {
      method: 'POST',
      headers: p.headers(llmApiKey),
      body: JSON.stringify({ model, max_tokens: 8000, system, messages: [{ role: 'user', content: prompt }] }),
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error?.message || `LLM error HTTP ${res.status}`)
    raw = d.content[0].text
    if (d.usage) usage = { totalTokens: (d.usage.input_tokens || 0) + (d.usage.output_tokens || 0) }
  } else {
    const res = await fetch(p.url, {
      method: 'POST',
      headers: p.headers(llmApiKey),
      body: JSON.stringify({
        model, max_tokens: 8000, temperature: 0.75,
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      }),
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error?.message || `LLM error HTTP ${res.status}`)
    raw = d.choices[0].message.content
    if (d.usage) usage = { totalTokens: d.usage.total_tokens || 0 }
  }

  return { leads: parseLeads(raw), usage }
}

// ─── Format Validation ────────────────────────────────────────────────────────

function validatePhone(phone) {
  if (!phone) return { valid: false, type: 'UNKNOWN', country: null, formatted: null }
  try {
    const p = parsePhoneNumber(phone, 'US')
    return { valid: p.isValid(), type: p.getType() || 'UNKNOWN', country: p.country || null, formatted: p.formatInternational() }
  } catch {
    return { valid: false, type: 'UNKNOWN', country: null, formatted: phone }
  }
}

function runFormatValidation(leads) {
  return leads.map(lead => {
    const ph = validatePhone(lead.phone)
    const emailValid = lead.email ? validator.isEmail(String(lead.email)) : false
    const urlValid   = lead.website ? validator.isURL(String(lead.website), { require_protocol: true, protocols: ['http', 'https'] }) : false
    return {
      ...lead,
      phone_valid:        ph.valid,
      phone_type:         ph.type,
      phone_country:      ph.country,
      phone_formatted:    ph.formatted,
      email_format_valid: emailValid,
      url_format_valid:   urlValid,
    }
  })
}

// ─── Clearbit Identity Check ──────────────────────────────────────────────────

function extractDomain(url) {
  if (!url) return null
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase() }
  catch { return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase() }
}

async function clearbitLookup(name) {
  try {
    const ac = new AbortController()
    setTimeout(() => ac.abort(), 5000)
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(name)}`,
      { signal: ac.signal }
    )
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) && data.length ? data[0] : null
  } catch { return null }
}

async function enrichWithClearbit(leads) {
  return Promise.all(leads.map(async lead => {
    const result = await clearbitLookup(lead.name)
    if (!result?.domain) return { ...lead, clearbit_domain: null, clearbit_match: 'not_found' }
    const leadDomain     = extractDomain(lead.website)
    const clearbitDomain = result.domain.toLowerCase().replace(/^www\./, '')
    let clearbit_match = 'not_found'
    if (leadDomain) {
      clearbit_match = (leadDomain === clearbitDomain || leadDomain.endsWith(`.${clearbitDomain}`))
        ? 'match' : 'mismatch'
    }
    return { ...lead, clearbit_domain: result.domain, clearbit_match }
  }))
}

// ─── Hunter.io ────────────────────────────────────────────────────────────────

async function enrichWithHunter(leads, apiKey, budget = 25) {
  if (!apiKey?.trim() || budget <= 0) return { leads, used: 0 }
  let used = 0
  const updates = new Map()
  for (const lead of leads) {
    if (used >= budget) break
    if (lead.score === 'low') continue
    if (!lead.website) continue
    if (lead.email && lead.email_format_valid) continue
    const domain = extractDomain(lead.website)
    if (!domain) continue
    try {
      const res = await fetch(
        `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=5`
      )
      used++
      if (res.ok) {
        const d = await res.json()
        const emails = d?.data?.emails || []
        if (emails.length) {
          const best = [...emails].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
          updates.set(lead.name, { email: best.value, email_source: 'hunter', email_confidence: best.confidence, email_format_valid: true })
        }
      }
    } catch { used++ }
  }
  return {
    leads: leads.map(l => { const p = updates.get(l.name); return p ? { ...l, ...p } : l }),
    used,
  }
}

// ─── AbstractAPI (Email + Phone) ──────────────────────────────────────────────
// Both run serially at 1 req/sec per API limit.
// Top 3 hot leads only in API context (keeps response time under 10s).

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function enrichWithAbstractAPI(leads, emailApiKey, phoneApiKey) {
  const hasEmail = !!emailApiKey?.trim()
  const hasPhone = !!phoneApiKey?.trim()
  if (!hasEmail && !hasPhone) return { leads, emailUsed: 0, phoneUsed: 0 }

  const candidates = leads.filter(l => l.score === 'hot').slice(0, 3) // top-3 for API timeout safety
  let emailUsed = 0, phoneUsed = 0
  const updates = new Map()

  for (const lead of candidates) {
    const patch = {}
    if (hasEmail && lead.email && lead.email_format_valid) {
      try {
        const res = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${emailApiKey}&email=${encodeURIComponent(lead.email)}`)
        emailUsed++
        if (res.ok) {
          const d = await res.json()
          patch.email_deliverable = d.deliverability === 'DELIVERABLE'
          patch.email_smtp_valid  = d.is_smtp_valid?.value === true
          patch.email_disposable  = d.is_disposable_email?.value === true
        }
        await sleep(1100)
      } catch { emailUsed++ }
    }
    if (hasPhone && lead.phone && lead.phone_valid) {
      try {
        const res = await fetch(`https://phonevalidation.abstractapi.com/v1/?api_key=${phoneApiKey}&phone=${encodeURIComponent(lead.phone)}`)
        phoneUsed++
        if (res.ok) {
          const d = await res.json()
          if (d.type)    patch.phone_type    = d.type.toUpperCase()
          if (d.carrier) patch.phone_carrier = d.carrier
        }
        await sleep(1100)
      } catch { phoneUsed++ }
    }
    if (Object.keys(patch).length) updates.set(lead.name, patch)
  }

  return {
    leads: leads.map(l => { const p = updates.get(l.name); return p ? { ...l, ...p } : l }),
    emailUsed, phoneUsed,
  }
}

// ─── Website Reachability ─────────────────────────────────────────────────────
// Server-side: standard fetch with HEAD, 6 s timeout, no-cors not needed.

function mapsUrl(name, address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`
}

async function checkWebsite(url) {
  try {
    const ac = new AbortController()
    setTimeout(() => ac.abort(), 6000)
    const res = await fetch(url, { method: 'HEAD', signal: ac.signal, redirect: 'follow' })
    return res.status < 500
  } catch { return false }
}

async function verifyReachability(leads) {
  return Promise.all(leads.map(async lead => {
    const web_verified = lead.website && lead.url_format_valid
      ? await checkWebsite(lead.website)
      : lead.website ? false : null
    return { ...lead, web_verified, maps_url: mapsUrl(lead.name, lead.address) }
  }))
}

// ─── Confidence Score ─────────────────────────────────────────────────────────

function computeConfidence(lead) {
  let s = 0
  if (lead.web_verified === true)       s++
  if (lead.email_format_valid === true) s++
  if (lead.email_deliverable === true)  s++
  if (lead.phone_valid === true)        s++
  if (lead.clearbit_match === 'match')  s++
  return s
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS }
  }

  if (event.httpMethod !== 'POST') {
    return err(405, 'Method not allowed. Use POST.')
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  const validKey = process.env.FORGE_API_KEY

  if (!validKey) return err(500, 'Server misconfiguration: FORGE_API_KEY env variable not set.')
  if (!token || token !== validKey) return err(401, 'Unauthorized. Provide a valid Bearer token.')

  // ── Parse body ────────────────────────────────────────────────────────────
  let body
  try { body = JSON.parse(event.body || '{}') }
  catch { return err(400, 'Invalid JSON body.') }

  const {
    state, country, product,
    llmProvider, llmModel, llmApiKey,
    hunterApiKey, abstractEmailKey, abstractPhoneKey,
  } = body

  // ── Validate required fields ──────────────────────────────────────────────
  const missing = []
  if (!state?.trim())     missing.push('state')
  if (!country?.trim())   missing.push('country')
  if (!product)           missing.push('product')
  if (!llmProvider)       missing.push('llmProvider')
  if (!llmModel)          missing.push('llmModel')
  if (!llmApiKey?.trim()) missing.push('llmApiKey')
  if (missing.length)     return err(400, 'Missing required fields.', { missing })

  if (!VALID_PROVIDERS.includes(llmProvider))
    return err(400, `Invalid llmProvider. Must be one of: ${VALID_PROVIDERS.join(', ')}`)

  if (!PRODUCTS.find(p => p.id === product))
    return err(400, `Invalid product. Must be one of: ${PRODUCTS.map(p => p.id).join(', ')}`)

  const productMeta = PRODUCTS.find(p => p.id === product)

  // ── Pipeline ──────────────────────────────────────────────────────────────
  try {
    // Stage 0: LLM Discovery
    const { leads: raw, usage } = await callLLM({
      providerKey: llmProvider, model: llmModel, state, country, product, llmApiKey,
    })

    // Stage 1: Format Validation
    const validated = runFormatValidation(raw)
    const fmtStats = {
      phones: validated.filter(l => l.phone_valid).length,
      emails: validated.filter(l => l.email_format_valid).length,
      urls:   validated.filter(l => l.url_format_valid).length,
    }

    // Stage 2: Identity Check (Clearbit)
    const afterClearbit = await enrichWithClearbit(validated)
    const clearbitStats = {
      match:    afterClearbit.filter(l => l.clearbit_match === 'match').length,
      mismatch: afterClearbit.filter(l => l.clearbit_match === 'mismatch').length,
      notFound: afterClearbit.filter(l => l.clearbit_match === 'not_found').length,
    }

    // Stage 3: Contact Enrichment
    let enriched = afterClearbit
    let hunterStats    = { used: 0, emailsFound: 0 }
    let abstractStats  = { emailUsed: 0, phoneUsed: 0 }

    if (hunterApiKey?.trim()) {
      const rHunter = await enrichWithHunter(enriched, hunterApiKey, 25)
      enriched    = rHunter.leads
      hunterStats = { used: rHunter.used, emailsFound: enriched.filter(l => l.email_source === 'hunter').length }
    }

    if (abstractEmailKey?.trim() || abstractPhoneKey?.trim()) {
      const rAbstract = await enrichWithAbstractAPI(enriched, abstractEmailKey, abstractPhoneKey)
      enriched      = rAbstract.leads
      abstractStats = { emailUsed: rAbstract.emailUsed, phoneUsed: rAbstract.phoneUsed }
    }

    // Apply confidence
    enriched = enriched.map(l => ({ ...l, confidence: computeConfidence(l) }))

    // Stage 4: Reachability
    const verified = await verifyReachability(enriched)
    const reachStats = {
      live:      verified.filter(l => l.web_verified === true).length,
      unreachable: verified.filter(l => l.web_verified === false).length,
      noWebsite: verified.filter(l => l.web_verified === null).length,
    }

    // Filter: hot + live only
    const qualified = verified.filter(l => l.score === 'hot' && l.web_verified === true)

    return json(200, {
      ok: true,
      meta: {
        state,
        country,
        product,
        productName: productMeta.name,
        discovered: raw.length,
        qualified:  qualified.length,
        pipeline: {
          formatValidation: fmtStats,
          clearbit:         clearbitStats,
          hunter:           hunterStats,
          abstractApi:      abstractStats,
          reachability:     reachStats,
        },
        tokens: usage.totalTokens,
      },
      leads: qualified,
    })
  } catch (e) {
    return err(500, 'Pipeline error.', { message: e.message })
  }
}
