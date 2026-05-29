import { useState } from 'react'
import { PROVIDERS } from '../config/providers.js'

function IconHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function IconForge() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      <path d="M11 8v3l2 2"/>
    </svg>
  )
}

function IconBlueprint() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',      Icon: IconHome },
  { id: 'forge',    label: 'Forge',     Icon: IconForge },
  { id: 'plan',     label: 'Blueprint', Icon: IconBlueprint },
  { id: 'settings', label: 'Settings',  Icon: IconSettings },
]

export default function Sidebar({
  currentView, setCurrentView,
  providerKey,
  model,
  usageToday,
  enrichUsage,
  hasPlacesKey,
}) {
  const provider = PROVIDERS[providerKey]

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-wordmark">
          C<span className="brand-wordmark-plum">ur</span>cible<span className="brand-wordmark-plum">.</span>
        </div>
        <div className="brand-sub">Workspace</div>
      </div>

      {/* Nav */}
      <nav className="s-section s-nav">
        <div className="s-label">
          <span className="s-label-dot" />
          Products
        </div>
        <div className="nav-list">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-item ${currentView === id ? 'nav-item--active' : ''}`}
              onClick={() => setCurrentView(id)}
            >
              <span className="nav-item-icon"><Icon /></span>
              <span className="nav-item-label">{label}</span>
              {currentView === id && <span className="nav-item-dot" />}
            </button>
          ))}
        </div>
      </nav>

      {/* Forge — active provider + usage */}
      {currentView === 'forge' && (
        <>
          <div className="s-section">
            <div className="s-label">
              <span className="s-label-dot" />
              Active Provider
            </div>
            <div className="s-provider-chip">
              <span className="s-provider-chip-name">{provider.label}</span>
              <span className="s-provider-chip-model">
                {provider.models.find(m => m.id === model)?.name || model}
              </span>
            </div>
          </div>

          <div className="s-section">
            <div className="s-label">
              <span className="s-label-dot" style={{ background: hasPlacesKey ? '#2D6A4F' : undefined }} />
              Data Source
            </div>
            <div className="rate-box" style={{ marginTop: 0 }}>
              <div className="rate-row">
                <span>Mode</span>
                <b style={{ color: hasPlacesKey ? '#2D6A4F' : 'var(--plum)' }}>
                  {hasPlacesKey ? '● Real · Places' : '○ Synthetic · LLM'}
                </b>
              </div>
              {hasPlacesKey && (
                <div className="rate-row">
                  <span>Stage 0</span>
                  <b>Google Places</b>
                </div>
              )}
            </div>
          </div>

          {/* Live usage */}
          <div className="s-section">
            <div className="s-label">
              <span className="s-label-dot" style={{ background: usageToday?.requests > 0 ? 'var(--plum)' : undefined }} />
              Usage Today
            </div>
            {provider.dailyReqLimit != null ? (() => {
              const used  = usageToday?.requests || 0
              const limit = provider.dailyReqLimit
              const rem   = Math.max(0, limit - used)
              const pct   = Math.min(100, (used / limit) * 100)
              const barColor = pct >= 90 ? '#c0392b' : pct >= 70 ? 'var(--plum)' : '#2D6A4F'
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--stone)' }}>Requests</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink)' }}>{used.toLocaleString()} / {limit.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--parchment)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 2, transition: 'width .4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--stone)' }}>used</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: barColor, fontWeight: 500 }}>{rem.toLocaleString()} remaining</span>
                    </div>
                  </div>
                  {(usageToday?.totalTokens > 0) && (
                    <div className="rate-box" style={{ marginTop: 0 }}>
                      <div className="rate-row">
                        <span>Tokens used</span>
                        <b>{(usageToday.totalTokens).toLocaleString()}</b>
                      </div>
                    </div>
                  )}
                </div>
              )
            })() : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(usageToday?.requests > 0) ? (
                  <div className="rate-box" style={{ marginTop: 0 }}>
                    <div className="rate-row">
                      <span>Runs today</span>
                      <b>{usageToday.requests}</b>
                    </div>
                    {usageToday.totalTokens > 0 && (
                      <div className="rate-row">
                        <span>Tokens used</span>
                        <b>{(usageToday.totalTokens).toLocaleString()}</b>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ghost)', letterSpacing: '0.08em' }}>No runs yet today</div>
                )}
              </div>
            )}
          </div>

          {/* Enrichment quota */}
          <div className="s-section">
            <div className="s-label">
              <span className="s-label-dot" />
              Enrichment Quota
            </div>
            <div className="rate-box">
              {[
                { label: 'AbstractAPI · Email', key: 'abstract_email', limit: 100 },
                { label: 'AbstractAPI · Phone', key: 'abstract_phone', limit: 100 },
                { label: 'Hunter.io',           key: 'hunter',         limit: 25  },
              ].map(({ label, key, limit }) => {
                const used = enrichUsage?.[key] || 0
                const rem  = Math.max(0, limit - used)
                const pct  = used / limit
                const color = pct >= 0.9 ? '#c0392b' : pct >= 0.6 ? 'var(--plum)' : '#2D6A4F'
                return (
                  <div className="rate-row" key={key}>
                    <span>{label}</span>
                    <b style={{ color }}>{rem} / {limit}</b>
                  </div>
                )
              })}
              <div className="rate-row">
                <span>Clearbit</span>
                <b style={{ color: '#2D6A4F' }}>∞</b>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Blueprint info */}
      {currentView === 'plan' && (
        <div className="s-section">
          <div className="s-label">
            <span className="s-label-dot" />
            About Blueprint
          </div>
          <div className="s-info-text">
            8-product sequential implementation plan. Phase-by-phase build order with timelines, dependencies, and resource requirements.
          </div>
          <div className="s-info-stats">
            <div className="s-info-stat">
              <span className="s-info-stat-n">8</span>
              <span className="s-info-stat-l">Products</span>
            </div>
            <div className="s-info-stat">
              <span className="s-info-stat-n">~14</span>
              <span className="s-info-stat-l">Months</span>
            </div>
            <div className="s-info-stat">
              <span className="s-info-stat-n">4</span>
              <span className="s-info-stat-l">Phases</span>
            </div>
          </div>
        </div>
      )}

      {/* Home info */}
      {currentView === 'home' && (
        <div className="s-section">
          <div className="s-label">
            <span className="s-label-dot" />
            About
          </div>
          <div className="s-info-text">
            Curcible's internal workspace. Tools built for operations, lead generation, and strategic planning.
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <span className="sf-tag">libphonenumber</span>
        <span className="sf-sep">·</span>
        <span className="sf-tag">clearbit</span>
        <span className="sf-sep">·</span>
        <span className="sf-tag">hunter</span>
        <span className="sf-sep">·</span>
        <span className="sf-tag">abstractapi</span>
      </div>
    </aside>
  )
}
