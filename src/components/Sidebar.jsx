import { useState } from 'react'
import { PROVIDERS, PROVIDER_KEYS } from '../config/providers.js'

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

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

function IconZap() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}


function EnrichRemaining({ used = 0, limit }) {
  const rem = Math.max(0, limit - used)
  const pct = used / limit
  const color = pct >= 0.9 ? '#c0392b' : pct >= 0.6 ? 'var(--plum)' : '#2D6A4F'
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {rem} / {limit} left
    </span>
  )
}

const NAV_ITEMS = [
  { id: 'home',  label: 'Home',      Icon: IconHome },
  { id: 'forge', label: 'Forge',     Icon: IconForge },
  { id: 'plan',  label: 'Blueprint', Icon: IconBlueprint },
]

const FORGE_STACK = [
  { Icon: IconSearch, name: 'local-client-prospector', desc: 'Business discovery layer' },
  { Icon: IconGlobe,  name: 'ScrapeGraphAI',           desc: 'Website enrichment (LLM)' },
  { Icon: IconZap,    name: 'free-llm-api-resources',  desc: 'Zero-cost inference routing' },
]

export default function Sidebar({
  currentView, setCurrentView,
  providerKey, setProviderKey,
  model, setModel,
  apiKey, setApiKey,
  abstractEmailKey, setAbstractEmailKey,
  abstractPhoneKey, setAbstractPhoneKey,
  hunterApiKey, setHunterApiKey,
  usageToday,
  enrichUsage,
}) {
  const [showKey, setShowKey] = useState(false)
  const [showAbstractEmailKey, setShowAbstractEmailKey] = useState(false)
  const [showAbstractPhoneKey, setShowAbstractPhoneKey] = useState(false)
  const [showHunterKey, setShowHunterKey] = useState(false)
  const provider = PROVIDERS[providerKey]

  function handleProviderChange(e) {
    const key = e.target.value
    setProviderKey(key)
    setModel(PROVIDERS[key].models[0].id)
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-wordmark">
          C<span className="brand-wordmark-plum">ur</span>cible<span className="brand-wordmark-plum">.</span>
        </div>
        <div className="brand-sub">Workspace</div>
      </div>

      {/* Product nav */}
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

      {/* Forge settings — only shown in forge view */}
      {currentView === 'forge' && (
        <>
          <div className="s-section">
            <div className="s-label">
              <span className="s-label-dot" />
              LLM Provider
            </div>

            <div className="field">
              <label>Provider</label>
              <select value={providerKey} onChange={handleProviderChange}>
                {PROVIDER_KEYS.map(k => (
                  <option key={k} value={k}>{PROVIDERS[k].label}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Model</label>
              <select value={model} onChange={e => setModel(e.target.value)}>
                {provider.models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>API Key</label>
              <div className="key-wrap">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Paste your key…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="key-eye" onClick={() => setShowKey(v => !v)}>
                  {showKey ? 'hide' : 'show'}
                </button>
              </div>
            </div>

            <div className="provider-pill">
              <span className="dot" />
              <span>{provider.pill}</span>
            </div>

            <div className="rate-box">
              {provider.limits.map(([k, v]) => (
                <div className="rate-row" key={k}>
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </div>

          {/* Live usage */}
          <div className="s-section">
            <div className="s-label">
              <span className="s-label-dot" style={{ background: usageToday?.requests > 0 ? 'var(--plum)' : undefined }} />
              Usage Today
            </div>
            {provider.dailyReqLimit != null ? (() => {
              const used = usageToday?.requests || 0
              const limit = provider.dailyReqLimit
              const remaining = Math.max(0, limit - used)
              const pct = Math.min(100, (used / limit) * 100)
              const barColor = pct >= 90 ? '#c0392b' : pct >= 70 ? 'var(--plum)' : '#2D6A4F'
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--stone)' }}>Requests</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink)' }}>{used.toLocaleString()} / {limit.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--parchment)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 2, transition: 'width .4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--stone)' }}>used</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: barColor, fontWeight: 500 }}>{remaining.toLocaleString()} remaining</span>
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
                {(usageToday?.requests > 0) && (
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
                )}
                {(!usageToday?.requests) && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ghost)', letterSpacing: '0.08em' }}>No runs yet today</div>
                )}
              </div>
            )}
          </div>

          {/* Enrichment Keys */}
          <div className="s-section">
            <div className="s-label">
              <span className="s-label-dot" />
              Enrichment Keys
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--ghost)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>optional</span>
            </div>

            {/* AbstractAPI Email */}
            <div className="field">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>AbstractAPI · Email</span>
                <EnrichRemaining used={enrichUsage?.abstract_email} limit={100} />
              </label>
              <div className="key-wrap">
                <input
                  type={showAbstractEmailKey ? 'text' : 'password'}
                  value={abstractEmailKey}
                  onChange={e => setAbstractEmailKey(e.target.value)}
                  placeholder="Email SMTP verify…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="key-eye" onClick={() => setShowAbstractEmailKey(v => !v)}>
                  {showAbstractEmailKey ? 'hide' : 'show'}
                </button>
              </div>
            </div>

            {/* AbstractAPI Phone */}
            <div className="field">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>AbstractAPI · Phone</span>
                <EnrichRemaining used={enrichUsage?.abstract_phone} limit={100} />
              </label>
              <div className="key-wrap">
                <input
                  type={showAbstractPhoneKey ? 'text' : 'password'}
                  value={abstractPhoneKey}
                  onChange={e => setAbstractPhoneKey(e.target.value)}
                  placeholder="Phone carrier verify…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="key-eye" onClick={() => setShowAbstractPhoneKey(v => !v)}>
                  {showAbstractPhoneKey ? 'hide' : 'show'}
                </button>
              </div>
            </div>

            {/* Hunter.io */}
            <div className="field">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Hunter.io</span>
                <EnrichRemaining used={enrichUsage?.hunter} limit={25} />
              </label>
              <div className="key-wrap">
                <input
                  type={showHunterKey ? 'text' : 'password'}
                  value={hunterApiKey}
                  onChange={e => setHunterApiKey(e.target.value)}
                  placeholder="Email discovery…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="key-eye" onClick={() => setShowHunterKey(v => !v)}>
                  {showHunterKey ? 'hide' : 'show'}
                </button>
              </div>
            </div>

            <div className="rate-box">
              <div className="rate-row">
                <span>Clearbit Autocomplete</span>
                <b style={{ color: '#2D6A4F' }}>Always on</b>
              </div>
            </div>
          </div>

        </>
      )}

      {/* Blueprint info — only shown in plan view */}
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

      {/* Home info — shown on hub */}
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
