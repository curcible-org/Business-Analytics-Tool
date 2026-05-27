export function exportCSV(leads) {
  if (!leads.length) return
  const headers = [
    'Name', 'Address', 'Phone', 'Phone Formatted', 'Phone Type', 'Phone Carrier',
    'Email', 'Email Source', 'Email Deliverable', 'Website', 'Social Only',
    'Industry', 'Score', 'Buy Probability', 'Website Quality',
    'Services', 'Tech Stack', 'Pain Points', 'Problem Solved',
    'Sale Strategy', 'Recommended Products', 'Notes',
    'Web Verified', 'Maps URL',
    'Clearbit Domain', 'Clearbit Match',
    'Confidence',
  ]
  const rows = leads.map(l => [
    l.name,
    l.address,
    l.phone || '',
    l.phone_formatted || '',
    l.phone_type || '',
    l.phone_carrier || '',
    l.email || '',
    l.email_source || '',
    l.email_deliverable === true ? 'Yes' : l.email_deliverable === false ? 'No' : '',
    l.website || '',
    l.social_only ? 'Yes' : 'No',
    l.industry || '',
    l.score,
    l.buy_probability != null ? `${l.buy_probability}%` : '',
    l.website_quality || '',
    (l.services || []).join('; '),
    (l.tech_stack || []).join('; '),
    (l.pain_points || []).join('; '),
    l.problem_solved || '',
    l.sale_strategy || '',
    (l.recommended_products || []).join('; '),
    l.notes || '',
    l.web_verified === true ? 'Live' : l.web_verified === false ? 'Unreachable' : 'No website',
    l.maps_url || '',
    l.clearbit_domain || '',
    l.clearbit_match || '',
    l.confidence != null ? `${l.confidence}/5` : '',
  ])
  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = `forge-leads-${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
