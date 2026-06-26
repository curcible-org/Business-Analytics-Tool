// CSV export -- ToS-safe.
// Google Maps Platform terms bar caching/redistributing Places Content beyond
// the place_id. So the export deliberately OMITS Places-sourced fields
// (business name, formatted address, phone, website, rating) and instead ships:
//   - place_id + a place_id-based Google Maps link (the sanctioned reference)
//   - the operator's own intelligence (score, probability, strategy, pain points)
//   - contact data only when INDEPENDENTLY sourced (Hunter email), never Places
//   - an opt-out note for outreach compliance (GDPR / CAN-SPAM)
// Work the live business details on-screen via the Maps link; the file carries
// the analysis, not a resold copy of Google's data.
// Sample (watermarked, fictional) rows are never exportable.

const OPT_OUT_NOTE = 'Outreach must include sender identity + a working opt-out (CAN-SPAM / GDPR legitimate interest).'

export function exportCSV(leads) {
  if (!leads.length) return
  if (leads.some(l => l.is_sample)) {
    alert('Sample data cannot be exported. Add a Google Places key in Settings to run on real businesses.')
    return
  }

  const headers = [
    'Place ID', 'Google Maps Link', 'Industry',
    'Score', 'Buy Probability',
    'Pain Points', 'Problem Solved', 'Sale Strategy', 'Recommended Products',
    'Email (independently sourced)', 'Email Source', 'Email Deliverable',
    'Website Reachable', 'Confidence', 'Notes', 'Compliance Note',
  ]

  const rows = leads.map(l => [
    l.places_id || '',
    l.maps_url || '',
    l.industry || '',
    l.score || '',
    l.buy_probability != null ? `${l.buy_probability}%` : '',
    (l.pain_points || []).join('; '),
    l.problem_solved || '',
    l.sale_strategy || '',
    (l.recommended_products || []).join('; '),
    l.email_source && l.email_source !== 'places' ? (l.email || '') : '',
    l.email_source && l.email_source !== 'places' ? l.email_source : '',
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
