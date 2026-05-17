export function exportCSV(leads) {
  if (!leads.length) return
  const headers = [
    'Name', 'Address', 'Phone', 'Website', 'Social Only', 'Score',
    'Website Quality', 'Services', 'Tech Stack', 'Pain Points', 'Outreach Angle', 'Notes',
  ]
  const rows = leads.map(l => [
    l.name,
    l.address,
    l.phone || '',
    l.website || '',
    l.social_only ? 'Yes' : 'No',
    l.score,
    l.website_quality || '',
    (l.services || []).join('; '),
    (l.tech_stack || []).join('; '),
    (l.pain_points || []).join('; '),
    l.outreach_angle || '',
    l.notes || '',
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
