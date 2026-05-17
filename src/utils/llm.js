import { PROVIDERS } from '../config/providers.js'

function buildUserPrompt(loc, type, vp) {
  return `Generate exactly 8 realistic local business leads.

Location: ${loc}
Business type: ${type}
Value proposition the user is selling: "${vp}"

Return a JSON array of exactly 8 objects. Every object must have ALL of these fields:
{
  "name": "Business Name",
  "address": "Street, ${loc}",
  "phone": "+1 (XXX) XXX-XXXX",
  "website": "https://..." or null,
  "social_only": true or false,
  "score": "hot" | "warm" | "low" | "skip",
  "website_quality": "One sentence on their web presence",
  "services": ["service1","service2"],
  "tech_stack": ["Wix"] or ["WordPress"] or [],
  "pain_points": ["pain1","pain2"],
  "outreach_angle": "One compelling sentence matched to this business AND the value prop",
  "notes": "One line of context"
}

Scoring rules:
- hot   → no website OR obviously broken/outdated site, active business with real foot traffic
- warm  → basic site, clear room for improvement, genuine opportunity
- low   → okay presence, marginal opportunity
- skip  → strong online presence, not a fit

Target mix: 2 hot, 3 warm, 2 low, 1 skip.
Make names, addresses, phones realistic for ${loc}. Vary business sizes.
Return ONLY the JSON array.`
}

function parseLeads(txt) {
  const clean = txt.replace(/```json|```/gi, '').trim()
  const s = clean.indexOf('[')
  const e = clean.lastIndexOf(']')
  if (s === -1 || e === -1)
    throw new Error('Model did not return a JSON array. Check your API key and try again.')
  return JSON.parse(clean.slice(s, e + 1))
}

export async function callLLM({ providerKey, model, loc, type, vp, apiKey }) {
  const p = PROVIDERS[providerKey]
  const system = `You are a lead intelligence engine. Output ONLY a raw JSON array — no markdown, no backticks, no preamble.`
  const user = buildUserPrompt(loc, type, vp)

  let raw

  if (p.fmt === 'anthropic') {
    const res = await fetch(p.url, {
      method: 'POST',
      headers: p.headers(apiKey),
      body: JSON.stringify({
        model,
        max_tokens: 2200,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error?.message || `HTTP ${res.status}`)
    raw = d.content[0].text
  } else {
    const res = await fetch(p.url, {
      method: 'POST',
      headers: p.headers(apiKey),
      body: JSON.stringify({
        model,
        max_tokens: 2200,
        temperature: 0.75,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error?.message || `HTTP ${res.status}`)
    raw = d.choices[0].message.content
  }

  return parseLeads(raw)
}
