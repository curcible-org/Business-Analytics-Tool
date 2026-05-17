import { useState } from 'react'
import { exportCSV } from '../utils/csv.js'

function WebCell({ lead }) {
  if (lead.social_only) return <span className="soc-tag">Social only</span>
  if (!lead.website)    return <span className="no-web">No website</span>
  return (
    <>
      <a
        className="web-link"
        href={lead.website}
        target="_blank"
        rel="noopener noreferrer"
        title={lead.website}
      >
        {lead.website.replace(/^https?:\/\//, '')}
      </a>
      {lead.website_quality && (
        <div className="web-q">{lead.website_quality}</div>
      )}
    </>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
      {copied ? '✓ Copied' : '↗ Copy'}
    </button>
  )
}

function LeadRow({ lead, hidden }) {
  return (
    <tr style={{ display: hidden ? 'none' : '' }}>
      <td>
        <div className="ln">{lead.name}</div>
        <div className="la">{lead.address}</div>
        {lead.phone && (
          <div className="la" style={{ color: 'var(--text-dim)', marginTop: 2 }}>{lead.phone}</div>
        )}
      </td>
      <td>
        <span className={`badge b-${lead.score}`}>{lead.score}</span>
      </td>
      <td>
        <WebCell lead={lead} />
      </td>
      <td>
        <div className="chips">
          {(lead.pain_points || []).slice(0, 3).map((p, i) => (
            <span key={i} className="chip">{p}</span>
          ))}
        </div>
      </td>
      <td>
        <div className="outreach-text">{lead.outreach_angle}</div>
        <CopyButton text={lead.outreach_angle || ''} />
      </td>
      <td>
        <div className="tech-tags">
          {(lead.tech_stack || []).map((t, i) => (
            <span key={i} className="ttag">{t}</span>
          ))}
        </div>
      </td>
    </tr>
  )
}

const FILTERS = [
  { key: 'all',  label: 'All' },
  { key: 'hot',  label: '🔥 Hot' },
  { key: 'warm', label: 'Warm' },
  { key: 'low',  label: 'Low' },
]

export default function Results({ leads, meta }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const hot  = leads.filter(l => l.score === 'hot').length
  const warm = leads.filter(l => l.score === 'warm').length
  const low  = leads.filter(l => l.score === 'low').length

  const title = meta ? `${meta.businessType} — ${meta.location}` : 'Lead Sheet'

  return (
    <div className="results">
      <div className="res-head">
        <div>
          <h2>{title}</h2>
          <div className="res-meta">
            {leads.length} leads · {hot} hot · {warm} warm · {low} low
          </div>
        </div>
        <div className="res-controls">
          <div className="filters">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`ftab${activeFilter === f.key ? ' on' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="export-btn" onClick={() => exportCSV(leads)}>
            ↓ Export CSV
          </button>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="lead-tbl">
          <thead>
            <tr>
              <th>Business</th>
              <th>Score</th>
              <th>Web Presence</th>
              <th>Pain Points</th>
              <th>Outreach Angle</th>
              <th>Tech Stack</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => (
              <LeadRow
                key={i}
                lead={lead}
                hidden={activeFilter !== 'all' && lead.score !== activeFilter}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
