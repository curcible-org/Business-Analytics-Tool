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
}) {
  const [showKey, setShowKey] = useState(false)
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

          <div className="s-section">
            <div className="s-label">
              <span className="s-label-dot" />
              Powered By
            </div>
            <div className="stack-list">
              {FORGE_STACK.map(({ Icon, name, desc }) => (
                <div className="stack-item" key={name}>
                  <div className="si-icon"><Icon /></div>
                  <div className="si-body">
                    <div className="si-name">{name}</div>
                    <div className="si-desc">{desc}</div>
                  </div>
                </div>
              ))}
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
    </aside>
  )
}
