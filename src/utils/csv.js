// CSV export -- FULL detail.
// Exports the full business detail (name, address, phone, website, rating) plus
// the operator's intelligence (score, probability, strategy, pain points) and a
// compliance note for outreach (GDPR / CAN-SPAM).
// NOTE: Google Maps Platform terms restrict caching/redistributing raw Places
// Content beyond the place_id. Exporting these fields is enabled per product
// requirement — use exported files in line with Google's terms and applicable law.
// Sample (watermarked, fictional) rows are never exportable.

const OPT_OUT_NOTE = 'Outreach must include sender identity + a working opt-out (CAN-SPAM / GDPR legitimate interest).'

export function exportCSV(leads) {
  if (!leads.length) return
  if (leads.some(l => l.is_sample)) {
    alert('Sample data cannot be exported. Run a search to fetch real businesses first.')
    return
  }

  const headers = [
    'Business Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews',
    'Place ID', 'Google Maps Link', 'Industry',
    'Score', 'Buy Probability',
    'Pain Points', 'Problem Solved', 'Sale Strategy', 'Recommended Products',
    'Email', 'Email Source', 'Email Deliverable',
    'Website Reachable', 'Confidence', 'Notes', 'Compliance Note',
  ]

  const rows = leads.map(l => [
    l.name || '',
    l.address || '',
    l.phone_formatted || l.phone || '',
    l.website || '',
    l.rating != null ? String(l.rating) : '',
    l.review_count != null ? String(l.review_count) : '',
    l.places_id || '',
    l.maps_url || '',
    l.industry || '',
    l.score || '',
    l.buy_probability != null ? `${l.buy_probability}%` : '',
    (l.pain_points || []).join('; '),
    l.problem_solved || '',
    l.sale_strategy || '',
    (l.recommended_products || []).join('; '),
    l.email || '',
    l.email_source || '',
    l.email_deliverable === true ? 'Yes' : l.email_deliverable === false ? 'No' : '',
    l.web_verified === true ? 'Resolves' : l.web_verified === false ? 'Unreachable' : 'No website',
    l.confidence != null ? `${l.confidence}/5` : '',
    l.notes || '',
    OPT_OUT_NOTE,
  ])

  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = `forge-intelligence-${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
