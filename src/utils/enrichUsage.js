// Monthly usage tracker for paid/capped enrichment APIs.
// Resets automatically when the month changes.

const KEY = 'forge_enrich_usage'
const MONTH = () => new Date().toISOString().slice(0, 7) // "2026-05"

export const ENRICH_LIMITS = {
  abstract_email: 100,
  abstract_phone: 100,
  hunter:          25,
}

export function loadEnrichUsage() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    if (raw.month === MONTH()) {
      return {
        month:          raw.month,
        abstract_email: raw.abstract_email || 0,
        abstract_phone: raw.abstract_phone || 0,
        hunter:         raw.hunter         || 0,
      }
    }
  } catch {}
  return { month: MONTH(), abstract_email: 0, abstract_phone: 0, hunter: 0 }
}

export function saveEnrichUsage(usage) {
  localStorage.setItem(KEY, JSON.stringify({ ...usage, month: MONTH() }))
}

export function remaining(usage, service) {
  return Math.max(0, ENRICH_LIMITS[service] - (usage[service] || 0))
}
