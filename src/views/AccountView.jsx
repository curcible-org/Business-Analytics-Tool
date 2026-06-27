import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../config/supabase.js'

const API_ENDPOINT = '/api/v1/leads'

function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconKey() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/>
    </svg>
  )
}

function IconCopy() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    quota: '50 runs / mo',
    rate: '6 / min',
    features: ['Forge access', 'API key management', 'Community support'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    quota: '500 runs / mo',
    rate: '30 / min',
    features: ['Everything in Free', '10× run quota', 'Priority support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    quota: '5,000 runs / mo',
    rate: '120 / min',
    features: ['Everything in Starter', '100× run quota', 'SLA + dedicated support'],
  },
]

export default function AccountView({ session }) {
  const [usage, setUsage]     = useState(null)
  const [keys, setKeys]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [newKey, setNewKey]   = useState('')
  const [busy, setBusy]       = useState(false)
  const [copied, setCopied]   = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      await supabase.rpc('forge_bootstrap_tenant')
      const [{ data: u, error: ue }, { data: k, error: ke }] = await Promise.all([
        supabase.rpc('forge_my_usage'),
        supabase.rpc('forge_my_keys'),
      ])
      if (ue) throw ue
      if (ke) throw ke
      setUsage(Array.isArray(u) ? u[0] : u)
      setKeys(k || [])
    } catch (err) {
      setError(err.message || 'Failed to load account.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function createKey() {
    setBusy(true); setError(''); setNewKey('')
    try {
      const { data, error } = await supabase.rpc('forge_create_api_key', { p_label: 'key' })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      setNewKey(row.api_key)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to create key.')
    } finally {
      setBusy(false)
    }
  }

  async function revokeKey(id) {
    setBusy(true); setError('')
    try {
      const { error } = await supabase.rpc('forge_revoke_api_key', { p_key_id: id })
      if (error) throw error
      await load()
    } catch (err) {
      setError(err.message || 'Failed to revoke key.')
    } finally {
      setBusy(false)
    }
  }

  async function upgrade(plan) {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout unavailable. Set Stripe env vars first.')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  function copyKey() {
    if (!newKey) return
    navigator.clipboard.writeText(newKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const pct = usage ? Math.min(100, Math.round((usage.used_this_month / usage.monthly_quota) * 100)) : 0
  const currentPlan = usage?.plan || 'free'

  const curlSnippet = `curl -s https://forge-lead-intelligence.netlify.app${API_ENDPOINT} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"state":"Texas","country":"United States","product":"P08"}'`

  return (
    <div className="acct-root">
      {/* ── Page header ── */}
      <div className="acct-header">
        <div className="acct-header-left">
          <span className="acct-eyebrow">Account</span>
          <h1 className="acct-title">API &amp; Usage</h1>
          <p className="acct-sub">Manage your API keys, track quota, and upgrade your plan.</p>
        </div>
        <div className="acct-header-right">
          <span className="acct-plan-badge">{currentPlan.toUpperCase()}</span>
        </div>
      </div>

      {error && (
        <div className="acct-error">{error}</div>
      )}

      {loading ? (
        <div className="acct-loading">Loading&hellip;</div>
      ) : (
        <div className="acct-body">

          {/* ── Top stat strip ── */}
          <div className="acct-stats">
            <div className="acct-stat">
              <span className="acct-stat-label">Plan</span>
              <span className="acct-stat-value">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</span>
            </div>
            <div className="acct-stat-div" />
            <div className="acct-stat">
              <span className="acct-stat-label">Runs this month</span>
              <span className="acct-stat-value">{usage?.used_this_month} <span className="acct-stat-of">/ {usage?.monthly_quota}</span></span>
            </div>
            <div className="acct-stat-div" />
            <div className="acct-stat">
              <span className="acct-stat-label">Rate limit</span>
              <span className="acct-stat-value">{usage?.rate_per_min} <span className="acct-stat-of">/ min</span></span>
            </div>
            <div className="acct-stat-div" />
            <div className="acct-stat acct-stat--meter">
              <span className="acct-stat-label">Quota used</span>
              <span className="acct-stat-value">{pct}%</span>
              <div className="acct-meter-track">
                <div
                  className="acct-meter-fill"
                  style={{ width: `${pct}%`, background: pct >= 90 ? '#a03030' : 'var(--plum)' }}
                />
              </div>
            </div>
          </div>

          {/* ── Two-column body ── */}
          <div className="acct-cols">

            {/* LEFT — API keys */}
            <div className="acct-col acct-col--left">
              <div className="acct-section-head">
                <div className="acct-section-label">
                  <IconKey />
                  API Keys
                </div>
                <button className="acct-create-btn" onClick={createKey} disabled={busy}>
                  {busy ? 'Creating…' : '+ New Key'}
                </button>
              </div>
              <p className="acct-section-note">
                Shown once at creation. Stored as a hash — treat them like passwords. Pass as <code className="acct-code">Bearer YOUR_KEY</code> in requests to <code className="acct-code">{API_ENDPOINT}</code>.
              </p>

              {newKey && (
                <div className="acct-new-key">
                  <div className="acct-new-key-label">
                    New key — copy now, shown once
                  </div>
                  <div className="acct-new-key-row">
                    <code className="acct-new-key-val">{newKey}</code>
                    <button className="acct-copy-btn" onClick={copyKey}>
                      {copied ? <IconCheck /> : <IconCopy />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              <div className="acct-keys-list">
                {keys.length === 0 ? (
                  <div className="acct-keys-empty">No keys yet. Create one to start making API calls.</div>
                ) : (
                  keys.map(k => (
                    <div className={`acct-key-row ${k.revoked ? 'acct-key-row--revoked' : ''}`} key={k.id}>
                      <div className="acct-key-info">
                        <span className="acct-key-prefix">{k.key_prefix}&hellip;</span>
                        {k.revoked && <span className="acct-key-tag">Revoked</span>}
                      </div>
                      {!k.revoked && (
                        <button className="acct-revoke-btn" onClick={() => revokeKey(k.id)} disabled={busy}>
                          Revoke
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Quick start */}
              <div className="acct-qs">
                <div className="acct-section-label" style={{ marginBottom: 10 }}>Quick Start</div>
                <pre className="acct-pre">{curlSnippet}</pre>
              </div>
            </div>

            {/* RIGHT — Plans */}
            <div className="acct-col acct-col--right">
              <div className="acct-section-head">
                <div className="acct-section-label">Plans</div>
              </div>
              <p className="acct-section-note">
                Checkout opens Stripe. Plan, quota, and rate limit update automatically on payment.
              </p>

              <div className="acct-plans">
                {PLANS.map(plan => {
                  const isCurrent = currentPlan === plan.id
                  return (
                    <div className={`acct-plan-card ${isCurrent ? 'acct-plan-card--current' : ''}`} key={plan.id}>
                      <div className="acct-plan-top">
                        <div>
                          <div className="acct-plan-name">{plan.name}</div>
                          <div className="acct-plan-quota">{plan.quota}</div>
                        </div>
                        <div className="acct-plan-price">{plan.price}<span>/mo</span></div>
                      </div>
                      <ul className="acct-plan-features">
                        {plan.features.map(f => (
                          <li key={f}>
                            <span className="acct-plan-check"><IconCheck /></span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="acct-plan-footer">
                        {isCurrent ? (
                          <span className="acct-plan-current-label">Current plan</span>
                        ) : (
                          <button
                            className="acct-upgrade-btn"
                            disabled={busy}
                            onClick={() => upgrade(plan.id)}
                          >
                            Upgrade to {plan.name}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
