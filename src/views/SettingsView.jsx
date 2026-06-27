import { useState } from 'react'
import { PROVIDERS, PROVIDER_KEYS } from '../config/providers.js'

function EnrichRemaining({ used = 0, limit }) {
  const rem = Math.max(0, limit - used)
  const pct = used / limit
  const color = pct >= 0.9 ? '#c0392b' : pct >= 0.6 ? 'var(--plum)' : '#2D6A4F'
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {rem} / {limit} left
    </span>
  )
}

function IconLogOut() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

export default function SettingsView({
  providerKey, setProviderKey,
  model, setModel,
  apiKey, setApiKey,
  abstractEmailKey, setAbstractEmailKey,
  abstractPhoneKey, setAbstractPhoneKey,
  hunterApiKey, setHunterApiKey,
  googlePlacesKey, setGooglePlacesKey,
  enrichUsage,
  onLogout,
  onClose,
}) {
  const [showKey, setShowKey]               = useState(false)
  const [showAbstractEmailKey, setShowAbstractEmailKey] = useState(false)
  const [showAbstractPhoneKey, setShowAbstractPhoneKey] = useState(false)
  const [showHunterKey, setShowHunterKey]   = useState(false)
  const [showPlacesKey, setShowPlacesKey]   = useState(false)
  const [savedAt, setSavedAt]               = useState(null)

  const provider = PROVIDERS[providerKey]

  function handleProviderChange(e) {
    const key = e.target.value
    setProviderKey(key)
    setModel(PROVIDERS[key].models[0].id)
  }

  function handleSave() {
    setSavedAt(new Date().toLocaleTimeString())
    if (onClose) setTimeout(onClose, 400)
  }

  return (
    <>
      <div className="so-head">
        <span className="so-title">Settings</span>
        <button className="so-close" onClick={onClose}><IconX /></button>
      </div>
      <div className="so-body">
      <div className="settings">

      {/* ── LLM Provider ── */}
      <div className="settings-section">
        <div className="settings-section-title">LLM Provider</div>

        <div className="settings-grid">
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

          <div className="field settings-grid-full">
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <div className="provider-pill">
            <span className="dot" />
            <span>{provider.pill}</span>
          </div>
        </div>

        <div className="rate-box" style={{ marginTop: 10 }}>
          {provider.limits.map(([k, v]) => (
            <div className="rate-row" key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Sources ── */}
      <div className="settings-section">
        <div className="settings-section-title">
          Data Sources
          <span style={{ marginLeft: 4, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ghost)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>optional</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--stone)', marginBottom: 14, lineHeight: 1.6 }}>
          Without a Places key, Forge generates leads via LLM (fast, synthetic). With a key, Stage 0 fetches <b>real businesses from Google Places</b> — the LLM then scores them instead of inventing them.
        </p>

        <div className="settings-grid">
          <div className="field settings-grid-full">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Google Places API Key</span>
              {googlePlacesKey.trim()
                ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>● Real mode active</span>
                : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ghost)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>○ Synthetic mode</span>
              }
            </label>
            <div className="key-wrap">
              <input
                type={showPlacesKey ? 'text' : 'password'}
                value={googlePlacesKey}
                onChange={e => setGooglePlacesKey(e.target.value)}
                placeholder="AIza… (GCP Places API key)"
                autoComplete="off"
                spellCheck={false}
              />
              <button className="key-eye" onClick={() => setShowPlacesKey(v => !v)}>
                {showPlacesKey ? 'hide' : 'show'}
              </button>
            </div>
          </div>
        </div>

        <div className="rate-box" style={{ marginTop: 10 }}>
          <div className="rate-row">
            <span>Text Search (New)</span>
            <b>$0.032 / request</b>
          </div>
          <div className="rate-row">
            <span>Monthly free credit</span>
            <b style={{ color: '#2D6A4F' }}>$200 ≈ 6,250 searches</b>
          </div>
          <div className="rate-row">
            <span>Setup</span>
            <b>GCP → APIs → Places API (New)</b>
          </div>
        </div>
      </div>

      {/* ── Enrichment Keys ── */}
      <div className="settings-section">
        <div className="settings-section-title">
          Enrichment Keys
          <span style={{ marginLeft: 4, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ghost)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>optional</span>
        </div>

        <div className="settings-grid">
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
        </div>

      </div>

      {/* ── Security ── */}
      <div className="settings-section">
        <div className="settings-section-title">Security</div>
        <p style={{ fontSize: 12, color: 'var(--stone)', marginBottom: 16 }}>
          Signing out clears your session. API keys remain saved in your browser.
        </p>
        <button className="settings-logout-btn" onClick={onLogout}>
          <IconLogOut />
          Sign out
        </button>
      </div>
    </div>
    </div>
    <div className="so-footer">
      <button className="so-save-btn" onClick={handleSave}>Save changes</button>
      {savedAt && <div className="so-saved-ts">Saved at {savedAt}</div>}
    </div>
    </>
  )
}
