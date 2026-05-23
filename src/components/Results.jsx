import { useState } from 'react'
import { exportCSV } from '../utils/csv.js'

function IconCopy() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconDownload() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

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
      {copied ? <IconCheck /> : <IconCopy />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function LeadRow({ lead }) {
  return (
    <tr>
      <td>
        <div className="ln">{lead.name}</div>
        <div className="la">{lead.address}</div>
        {lead.phone && (
          <div className="la" style={{ marginTop: 2 }}>{lead.phone}</div>
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

export default function Results({ leads, meta }) {
  const title = meta ? `${meta.businessType} — ${meta.location}` : 'Lead Sheet'

  return (
    <div className="results">
      <div className="res-head">
        <div>
          <h2>{title}</h2>
          <div className="res-meta">
            <span>{leads.length} leads</span>
          </div>
        </div>
        <div className="res-controls">
          <button className="export-btn" onClick={() => exportCSV(leads)}>
            <IconDownload />
            Export CSV
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
              <LeadRow key={i} lead={lead} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
