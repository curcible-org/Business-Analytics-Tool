import { useState } from 'react'
import { exportCSV } from '../utils/csv.js'
import { BLUEPRINT_PRODUCTS } from '../config/products.js'

const PRODUCT_MAP = Object.fromEntries(BLUEPRINT_PRODUCTS.map(p => [p.id, p]))

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

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function IconExternalLink() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

function IconMapPin() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

function WebVerifiedBadge({ status }) {
  // Browser check confirms the server answered (DNS/TCP/TLS), not an HTTP 200 —
  // so the honest label is "RESOLVES", never "LIVE".
  if (status === true)  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ok)', letterSpacing: '0.06em' }}>● RESOLVES</span>
  if (status === false) return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--danger)', letterSpacing: '0.06em' }}>✕ UNREACHABLE</span>
  return null
}

function ConfidenceBar({ value }) {
  if (value == null) return null
  const dots = 5
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {Array.from({ length: dots }, (_, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i < value
            ? (value >= 4 ? 'var(--ok)' : value >= 2 ? 'var(--plum)' : 'var(--stone)')
            : 'var(--ghost)',
          flexShrink: 0,
          display: 'inline-block',
        }} />
      ))}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stone)', marginLeft: 2 }}>{value}/5</span>
    </div>
  )
}

function PhoneChip({ type, carrier }) {
  if (!type || type === 'UNKNOWN') return null
  const color = type === 'MOBILE' ? 'var(--ok)' : type === 'VOIP' ? 'var(--danger)' : 'var(--stone)'
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {type}{carrier ? ` · ${carrier}` : ''}
    </span>
  )
}

function EmailSourceBadge({ source, deliverable }) {
  if (!source && deliverable == null) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {source === 'hunter' && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--plum)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Hunter</span>
      )}
      {deliverable === true && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ok)', letterSpacing: '0.06em' }}>✓ SMTP</span>
      )}
      {deliverable === false && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--danger)', letterSpacing: '0.06em' }}>✕ SMTP</span>
      )}
    </span>
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

function ProbabilityBar({ value }) {
  if (value == null) return null
  const pct = Math.max(0, Math.min(100, value))
  const color = pct >= 70 ? 'var(--ok)' : pct >= 40 ? 'var(--plum)' : 'var(--stone)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--plum-mid), var(--plum))', borderRadius: 6 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, flexShrink: 0 }}>{pct}%</span>
    </div>
  )
}

function ScoreBadge({ score }) {
  return <span className={`badge b-${score}`}>{score}</span>
}

function LeadCard({ lead, targetProduct, onClick }) {
  return (
    <div className="lcard" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="lcard-top">
        <div className="lcard-score">
          <ScoreBadge score={lead.score} />
          {lead.buy_probability != null && (
            <span className="lcard-prob" style={{
              color: lead.buy_probability >= 70 ? 'var(--ok)' : lead.buy_probability >= 40 ? 'var(--plum)' : 'var(--stone)'
            }}>{lead.buy_probability}%</span>
          )}
        </div>
        {lead.industry && (
          <span className="lcard-industry">{lead.industry}</span>
        )}
      </div>

      <div className="lcard-name">{lead.name || lead.industry || 'Local business'}</div>
      {lead.address && <div className="lcard-addr">{lead.address}</div>}
      {lead.rating != null && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--stone)', marginTop: 3 }}>
          <span style={{ color: 'var(--warm-c)' }}>{lead.rating}★</span> · {lead.review_count || 0} review{lead.review_count === 1 ? '' : 's'}
        </div>
      )}

      {lead.buy_probability != null && (
        <div style={{ marginTop: 10 }}>
          <ProbabilityBar value={lead.buy_probability} />
        </div>
      )}

      {lead.pain_points?.length > 0 && (
        <div className="lcard-chips">
          {lead.pain_points.slice(0, 3).map((p, i) => (
            <span key={i} className="chip">{p}</span>
          ))}
          {lead.pain_points.length > 3 && (
            <span className="chip chip-more">+{lead.pain_points.length - 3}</span>
          )}
        </div>
      )}

      {lead.confidence != null && (
        <div style={{ marginTop: 8 }}>
          <ConfidenceBar value={lead.confidence} />
        </div>
      )}

      <div className="lcard-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {lead.website ? (
            <span className="lcard-web">{lead.website.replace(/^https?:\/\//, '')}</span>
          ) : (
            <span className="no-web">No website</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <WebVerifiedBadge status={lead.web_verified} />
            {lead.maps_url && (
              <a
                href={lead.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--plum)', textDecoration: 'none', letterSpacing: '0.06em' }}
              >
                MAPS ↗
              </a>
            )}
          </div>
        </div>
        <span className="lcard-cta">View details →</span>
      </div>
    </div>
  )
}

function DetailSection({ label, children }) {
  return (
    <div className="dd-section">
      <div className="dd-label">{label}</div>
      <div className="dd-body">{children}</div>
    </div>
  )
}

function LeadDrawer({ lead, targetProduct, onClose }) {
  if (!lead) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div>
            <div className="drawer-name">{lead.name || lead.industry || 'Local business'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {lead.address && <div className="drawer-addr">{lead.address}</div>}
              {lead.rating != null && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stone)', letterSpacing: '0.04em' }}>
                  {lead.rating}★ · {lead.review_count || 0} reviews
                </span>
              )}
              {lead.maps_url && (
                <a
                  href={lead.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--plum)', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                  <IconMapPin /> Maps
                </a>
              )}
            </div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div className="drawer-body">
          {/* Score row */}
          <div className="dd-row-inline">
            <div>
              <div className="dd-label">Score</div>
              <div style={{ marginTop: 4 }}>
                <ScoreBadge score={lead.score} />
              </div>
            </div>
            {lead.buy_probability != null && (
              <div style={{ flex: 1 }}>
                <div className="dd-label">Buy Probability</div>
                <div style={{ marginTop: 6 }}>
                  <ProbabilityBar value={lead.buy_probability} />
                </div>
              </div>
            )}
            {lead.industry && (
              <div>
                <div className="dd-label">Industry</div>
                <div className="dd-body" style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{lead.industry}</div>
              </div>
            )}
          </div>

          {/* Confidence + Verification signals */}
          {(lead.confidence != null || lead.web_verified != null) && (
            <DetailSection label="Verification">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {lead.confidence != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.1em', width: 70, flexShrink: 0 }}>Confidence</span>
                    <ConfidenceBar value={lead.confidence} />
                  </div>
                )}
                {lead.web_verified != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.1em', width: 70, flexShrink: 0 }}>Website</span>
                    <WebVerifiedBadge status={lead.web_verified} />
                  </div>
                )}
              </div>
            </DetailSection>
          )}

          {/* Contact */}
          {(lead.phone || lead.email || lead.website) && (
            <DetailSection label="Contact">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {lead.phone && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <a href={`tel:${lead.phone}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)', textDecoration: 'none' }}>
                      {lead.phone_formatted || lead.phone}
                    </a>
                    <PhoneChip type={lead.phone_type} carrier={lead.phone_carrier} />
                  </div>
                )}
                {lead.email && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <a href={`mailto:${lead.email}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--plum)', textDecoration: 'none' }}>
                      {lead.email}
                    </a>
                    <EmailSourceBadge source={lead.email_source} deliverable={lead.email_deliverable} />
                  </div>
                )}
                {lead.website && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--plum)', textDecoration: 'none' }}>
                      {lead.website.replace(/^https?:\/\//, '')}
                      <IconExternalLink />
                    </a>
                    {lead.website_quality && (
                      <span style={{ fontSize: 11, color: 'var(--stone)' }}>{lead.website_quality}</span>
                    )}
                  </div>
                )}
                {lead.maps_url && (
                  <a href={lead.maps_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--plum)', textDecoration: 'none' }}>
                    Open in Google Maps
                    <IconExternalLink />
                  </a>
                )}
              </div>
            </DetailSection>
          )}

          {/* Services (from intelligence) */}
          {lead.services?.length > 0 && (
            <DetailSection label="Services">
              <div className="chips" style={{ flexWrap: 'wrap' }}>
                {lead.services.map((s, i) => <span key={i} className="chip">{s}</span>)}
              </div>
            </DetailSection>
          )}

          {/* Pain Points */}
          {lead.pain_points?.length > 0 && (
            <DetailSection label="Pain Points">
              <div className="chips" style={{ flexWrap: 'wrap' }}>
                {lead.pain_points.map((p, i) => (
                  <span key={i} className="chip">{p}</span>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Problem Solved */}
          {lead.problem_solved && (
            <DetailSection label="Problem Solved">
              <p className="dd-text">{lead.problem_solved}</p>
              <CopyButton text={lead.problem_solved} />
            </DetailSection>
          )}

          {/* Sale Strategy */}
          {lead.sale_strategy && (
            <DetailSection label="Sale Strategy">
              <p className="dd-text">{lead.sale_strategy}</p>
              <CopyButton text={lead.sale_strategy} />
            </DetailSection>
          )}

          {/* Recommended Products */}
          {lead.recommended_products?.length > 0 && (
            <DetailSection label="Fit Products">
              <div className="tech-tags">
                {lead.recommended_products.map(id => {
                  const p = PRODUCT_MAP[id]
                  if (!p) return null
                  const isTarget = id === targetProduct
                  return (
                    <span
                      key={id}
                      className="ttag"
                      title={`${p.name}: ${p.desc}`}
                      style={isTarget ? { background: 'var(--plum-pale2)', color: 'var(--plum)', borderColor: 'var(--plum-pale2)' } : {}}
                    >
                      {id}
                    </span>
                  )
                })}
              </div>
            </DetailSection>
          )}

          {/* Tech Stack */}
          {lead.tech_stack?.length > 0 && (
            <DetailSection label="Tech Stack">
              <div className="tech-tags">
                {lead.tech_stack.map((t, i) => (
                  <span key={i} className="ttag">{t}</span>
                ))}
              </div>
            </DetailSection>
          )}
        </div>
      </div>
    </>
  )
}

export default function Results({ leads, meta }) {
  const [selected, setSelected] = useState(null)
  const isSample = !!meta?.isSample
  const location = meta ? `${meta.locationState}, ${meta.locationCountry}` : ''
  const title = meta ? `${meta.productName} — ${location}` : 'Lead Sheet'

  return (
    <div className="results">
      <div className="res-head">
        <div>
          <h2>{title}</h2>
          <div className="res-meta">
            <span>{leads.length} hot · resolving leads</span>
            {meta?.blueprintProduct && (
              <>
                <span style={{ color: 'var(--ghost)', margin: '0 6px' }}>·</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {meta.blueprintProduct}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="res-controls">
          <button
            className="export-btn"
            onClick={() => exportCSV(leads)}
            disabled={isSample}
            title={isSample ? 'Sample data cannot be exported' : 'Export CSV'}
            style={isSample ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
          >
            <IconDownload />
            {isSample ? 'Export disabled (sample)' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="lcard-grid">
        {leads.map((lead, i) => (
          <LeadCard
            key={i}
            lead={lead}
            targetProduct={meta?.blueprintProduct}
            onClick={() => setSelected(lead)}
          />
        ))}
      </div>

      <LeadDrawer
        lead={selected}
        targetProduct={meta?.blueprintProduct}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
