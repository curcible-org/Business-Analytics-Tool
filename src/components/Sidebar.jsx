import { useState } from 'react'
import { PROVIDERS, PROVIDER_KEYS } from '../config/providers.js'

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

function IconForge() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  )
}

const STACK = [
  { Icon: IconSearch, name: 'local-client-prospector', desc: 'Business discovery layer' },
  { Icon: IconGlobe,  name: 'ScrapeGraphAI',           desc: 'Website enrichment (LLM)' },
  { Icon: IconZap,    name: 'free-llm-api-resources',  desc: 'Zero-cost inference routing' },
]

export default function Sidebar({ providerKey, setProviderKey, model, setModel, apiKey, setApiKey }) {
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
        <div className="brand-row">
          <div className="brand-logo">
            <IconForge />
          </div>
          <span className="brand-wordmark">Crucible</span>
        </div>
        <div className="brand-sub">Lead Intelligence Engine</div>
      </div>

      {/* LLM Provider config */}
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

      {/* Powered By stack */}
      <div className="s-section">
        <div className="s-label">
          <span className="s-label-dot" />
          Powered By
        </div>
        <div className="stack-list">
          {STACK.map(({ Icon, name, desc }) => (
            <div className="stack-item" key={name}>
              <div className="si-icon">
                <Icon />
              </div>
              <div className="si-body">
                <div className="si-name">{name}</div>
                <div className="si-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
