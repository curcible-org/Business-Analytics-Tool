// NOTE: The former Clearbit "identity check" stage was removed. Clearbit's free
// autocomplete endpoint was discontinued for new users (2025-04-30) and silently
// returned null, so the stage no-op'd while still emitting a clearbit_match
// column and inflating confidence. Shipping a check that does nothing misleads
// buyers, so it is gone. Domain matching is handled inline where needed.

function extractDomain(url) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
  }
}

// ─── Hunter.io Domain Search ──────────────────────────────────────────────────
// Free: 25 searches / month.
// Returns { leads, used } — used = number of API calls made this run.

async function hunterSearch(domain, apiKey) {
  try {
    const res = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=5`
    )
    if (!res.ok) return null
    const d = await res.json()
    const emails = d?.data?.emails || []
    if (!emails.length) return null
    const best = [...emails].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
    return { email: best.value, confidence: best.confidence, type: best.type }
  } catch {
    return null
  }
}

export async function enrichWithHunter(leads, apiKey, budget = 25) {
  if (!apiKey?.trim() || budget <= 0) return { leads, used: 0 }

  let used = 0
  const updates = new Map()

  for (const lead of leads) {
    if (used >= budget) break
    // Skip: low scored, no website, already has valid email
    if (lead.score === 'low') continue
    if (!lead.website) continue
    if (lead.email && lead.email_format_valid) continue

    const domain = extractDomain(lead.website)
    if (!domain) continue

    const result = await hunterSearch(domain, apiKey)
    used++

    if (result) {
      updates.set(lead.name, {
        email:              result.email,
        email_source:       'hunter',
        email_confidence:   result.confidence,
        email_format_valid: true,
      })
    }
  }

  return {
    leads: leads.map(l => {
      const patch = updates.get(l.name)
      return patch ? { ...l, ...patch } : l
    }),
    used,
  }
}

// ─── AbstractAPI Email Verification ──────────────────────────────────────────
// Free: 100 / month. Rate limit: 1 req/sec.

async function abstractEmailCheck(email, apiKey) {
  try {
    const res = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`
    )
    if (!res.ok) return null
    const d = await res.json()
    return {
      deliverable: d.deliverability === 'DELIVERABLE',
      smtp_valid:  d.is_smtp_valid?.value === true,
      disposable:  d.is_disposable_email?.value === true,
    }
  } catch {
    return null
  }
}

// ─── AbstractAPI Phone Validation ────────────────────────────────────────────
// Free: 100 / month. Rate limit: 1 req/sec. Separate key from email.

async function abstractPhoneCheck(phone, apiKey) {
  try {
    const res = await fetch(
      `https://phonevalidation.abstractapi.com/v1/?api_key=${apiKey}&phone=${encodeURIComponent(phone)}`
    )
    if (!res.ok) return null
    const d = await res.json()
    return {
      valid:   d.valid,
      type:    d.type?.toUpperCase() || null,
      carrier: d.carrier || null,
    }
  } catch {
    return null
  }
}

const delay = ms => new Promise(r => setTimeout(r, ms))

// Processes top hot leads only. Accepts separate email + phone keys and
// per-service budgets (remaining calls this month). Returns leads + usage delta.
export async function enrichWithAbstractAPI(leads, emailApiKey, phoneApiKey, emailBudget = 100, phoneBudget = 100) {
  const hasEmail = !!emailApiKey?.trim()
  const hasPhone = !!phoneApiKey?.trim()
  if (!hasEmail && !hasPhone) return { leads, emailUsed: 0, phoneUsed: 0 }

  // Top 5 hot leads only — conserves monthly quota
  const candidates = leads.filter(l => l.score === 'hot').slice(0, 5)

  let emailUsed = 0
  let phoneUsed = 0
  const updates = new Map()

  for (const lead of candidates) {
    const patch = {}

    // Email check — only if format valid, key present, and budget remains
    if (hasEmail && emailBudget > emailUsed && lead.email && lead.email_format_valid) {
      const r = await abstractEmailCheck(lead.email, emailApiKey)
      emailUsed++
      if (r) {
        patch.email_deliverable = r.deliverable
        patch.email_smtp_valid  = r.smtp_valid
        patch.email_disposable  = r.disposable
      }
      await delay(1100) // 1 req/sec hard limit
    }

    // Phone check — only if libphonenumber marked valid, key present, and budget remains
    if (hasPhone && phoneBudget > phoneUsed && lead.phone && lead.phone_valid) {
      const r = await abstractPhoneCheck(lead.phone, phoneApiKey)
      phoneUsed++
      if (r) {
        patch.phone_type    = r.type    || lead.phone_type
        patch.phone_carrier = r.carrier || null
      }
      await delay(1100)
    }

    if (Object.keys(patch).length) updates.set(lead.name, patch)
  }

  return {
    leads: leads.map(l => {
      const patch = updates.get(l.name)
      return patch ? { ...l, ...patch } : l
    }),
    emailUsed,
    phoneUsed,
  }
}

// ─── Confidence Score ─────────────────────────────────────────────────────────
// 0–5 points. Each point reflects a check that ACTUALLY RAN and passed — no
// credit for stages that no-op'd. Computed after all enrichment + reachability.

export function computeConfidence(lead) {
  let score = 0
  if (lead.web_verified === true)              score++ // website reachable (real status)
  if (lead.phone_valid === true)               score++ // phone format valid
  if (lead.email_format_valid === true)        score++ // email is valid format
  if (lead.email_source === 'hunter')          score++ // email independently sourced (Hunter)
  if (lead.email_deliverable === true)         score++ // SMTP confirmed (AbstractAPI)
  return score
}

export function applyConfidence(leads) {
  return leads.map(lead => ({ ...lead, confidence: computeConfidence(lead) }))
}
