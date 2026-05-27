import { parsePhoneNumber } from 'libphonenumber-js'
import validator from 'validator'

// ─── Phone ───────────────────────────────────────────────────────────────────

export function validatePhone(phone) {
  if (!phone) return { valid: false, type: 'UNKNOWN', country: null, formatted: null }
  try {
    const parsed = parsePhoneNumber(phone, 'US')
    const type = parsed.getType() || 'UNKNOWN'
    return {
      valid: parsed.isValid(),
      type,                          // MOBILE | FIXED_LINE | FIXED_LINE_OR_MOBILE | VOIP | UNKNOWN | …
      country: parsed.country || null,
      formatted: parsed.formatInternational(),
    }
  } catch {
    return { valid: false, type: 'UNKNOWN', country: null, formatted: phone }
  }
}

// ─── Email ────────────────────────────────────────────────────────────────────

export function validateEmailFormat(email) {
  if (!email) return { valid: false }
  return { valid: validator.isEmail(String(email)) }
}

// ─── URL ──────────────────────────────────────────────────────────────────────

export function validateUrl(url) {
  if (!url) return { valid: false }
  return {
    valid: validator.isURL(String(url), {
      require_protocol: true,
      protocols: ['http', 'https'],
    }),
  }
}

// ─── Batch ────────────────────────────────────────────────────────────────────

export function runFormatValidation(leads) {
  return leads.map(lead => {
    const phone  = validatePhone(lead.phone)
    const email  = validateEmailFormat(lead.email)
    const url    = validateUrl(lead.website)

    return {
      ...lead,
      phone_valid:        phone.valid,
      phone_type:         phone.type,         // may be overridden by AbstractAPI later
      phone_country:      phone.country,
      phone_formatted:    phone.formatted,
      email_format_valid: email.valid,
      url_format_valid:   url.valid,
    }
  })
}
