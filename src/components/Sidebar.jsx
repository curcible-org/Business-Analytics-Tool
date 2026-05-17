import { useState } from 'react'
import { PROVIDERS, PROVIDER_KEYS } from '../config/providers.js'

const STACK = [
  { icon: '🔍', name: 'local-client-prospector', desc: 'Business discovery layer' },
  { icon: '🕷️', name: 'ScrapeGraphAI',           desc: 'Website enrichment (LLM)' },
  { icon: '⚡', name: 'free-llm-api-resources',   desc: 'Zero-cost inference routing' },
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
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M7 14C7 9.582 10.134 6 14 6" stroke="#F5F2ED" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M21 14C21 18.418 17.866 22 14 22" stroke="#F5F2ED" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="1.8" fill="#C8460A"/>
          </svg>
          <span className="brand-wordmark">Crucible</span>
        </div>
        <div className="brand-sub">Lead Intelligence Engine</div>
      </div>

      {/* LLM Provider config */}
      <div className="s-section">
        <div className="s-label">LLM Provider</div>

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
        <div className="s-label">Powered By</div>
        <div className="stack-list">
          {STACK.map(s => (
            <div className="stack-item" key={s.name}>
              <span className="si-icon">{s.icon}</span>
              <div className="si-body">
                <div className="si-name">{s.name}</div>
                <div className="si-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
