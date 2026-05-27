import { PROVIDERS } from '../config/providers.js'
import { BLUEPRINT_PRODUCTS } from '../config/products.js'

const PRODUCT_LIST = BLUEPRINT_PRODUCTS
  .map(p => `${p.id} — ${p.name}: ${p.desc}`)
  .join('\n')

function buildUserPrompt(state, country, targetProduct) {
  const tp = BLUEPRINT_PRODUCTS.find(p => p.id === targetProduct) || BLUEPRINT_PRODUCTS[0]
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
  "phone": "+1 (XXX) XXX-XXXX",
  "email": "contact@businessdomain.com or null",
  "website": "https://..." or null,
  "social_only": true or false,
  "industry": "Short industry label e.g. Fitness & Gym / Medical Clinic / Hair Salon",
  "score": "hot" | "warm" | "low",
  "buy_probability": integer 0-100,
  "website_quality": "One sentence on their web presence",
  "services": ["service1","service2"],
  "tech_stack": ["Wix"] or ["WordPress"] or [],
  "pain_points": ["pain1","pain2"],
  "problem_solved": "One sentence describing the specific business problem this lead has that ${tp.name} directly solves",
  "sale_strategy": "2-3 sentences: how to sell ${tp.name} to THIS business based on their exact problem — entry point, angle, and close",
  "recommended_products": ["P01","P04"],
  "notes": "One line of context"
}

Scoring rules:
- hot  → no website OR broken/outdated site, active business, strong pain-point match to the product
- warm → basic site, clear room for improvement, genuine opportunity
- low  → marginal opportunity, weak but real match

Do NOT include "skip" leads — if a business is not a fit, simply exclude it.

buy_probability:
- hot  → 70–95
- warm → 40–69
- low  → 15–39
Adjust within range based on business size, tech maturity, and product pain-point match.

industry: concise label classifying the business sector (e.g. "Fitness & Gym", "Medical Clinic", "Dental Practice", "Hair Salon", "Real Estate Agency").

problem_solved: one sentence describing the concrete business problem this lead is experiencing that ${tp.name} directly fixes. Focus on the problem, not the pitch (e.g. "Loses potential clients after hours because no one answers incoming emails or calls").

sale_strategy: 2-3 sentences on exactly how to sell ${tp.name} to THIS specific business based on their exact problem_solved. Include: (1) the entry point — what specific pain to open with, (2) the positioning angle — how to frame the product for their context, (3) the close — what outcome to promise. Must differ meaningfully from other leads even if the product is the same.

recommended_products: 2–4 product IDs that are the best fit. Highlight ${tp.id} if applicable.

email: infer from business name/domain (info@, contact@, owner@). Use null only if no domain exists.

Return ONLY the JSON array. No markdown, no explanation.`
}

function parseLeads(txt) {
  const clean = txt.replace(/```json|```/gi, '').trim()
  const s = clean.indexOf('[')
  const e = clean.lastIndexOf(']')
  if (s === -1 || e === -1)
    throw new Error('Model did not return a JSON array. Check your API key and try again.')
  return JSON.parse(clean.slice(s, e + 1))
}

export async function callLLM({ providerKey, model, state, country, targetProduct, apiKey }) {
  const p = PROVIDERS[providerKey]
  const system = `You are a lead intelligence engine. Output ONLY a raw JSON array — no markdown, no backticks, no preamble.`
  const user = buildUserPrompt(state, country, targetProduct)

  let raw
  let usage = { totalTokens: 0 }

  if (p.fmt === 'anthropic') {
    const res = await fetch(p.url, {
      method: 'POST',
      headers: p.headers(apiKey),
      body: JSON.stringify({
        model,
        max_tokens: 8000,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error?.message || `HTTP ${res.status}`)
    raw = d.content[0].text
    if (d.usage) usage = { totalTokens: (d.usage.input_tokens || 0) + (d.usage.output_tokens || 0) }
  } else {
    const res = await fetch(p.url, {
      method: 'POST',
      headers: p.headers(apiKey),
      body: JSON.stringify({
        model,
        max_tokens: 8000,
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
    if (d.usage) usage = { totalTokens: d.usage.total_tokens || 0 }
  }

  return { leads: parseLeads(raw), usage }
}
