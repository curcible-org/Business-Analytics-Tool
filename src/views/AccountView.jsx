import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../config/supabase.js'

const API_ENDPOINT = '/api/v1/leads'

export default function AccountView({ session }) {
  const [usage, setUsage]   = useState(null)
  const [keys, setKeys]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [newKey, setNewKey] = useState('')   // plaintext shown once
  const [busy, setBusy]     = useState(false)

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

  const pct = usage ? Math.min(100, Math.round((usage.used_this_month / usage.monthly_quota) * 100)) : 0

  return (
    <>
      <div className="main-head">
        <h1>Account<em> &mdash; API &amp; Usage</em></h1>
        <p>Your hosted Forge API keys, monthly quota, and usage. Keys authenticate calls to <code>{API_ENDPOINT}</code>; provider keys stay server-side.</p>
      </div>

      <div className="content">
        {error && <div className="err-banner">{error}</div>}
        {loading ? (
          <p style={{ color: 'var(--stone)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading&hellip;</p>
        ) : (
          <>
            <div className="settings-section">
              <div className="settings-section-title">Plan &amp; usage</div>
              <div className="rate-box">
                <div className="rate-row"><span>Plan</span><b style={{ textTransform: 'uppercase' }}>{usage?.plan}</b></div>
                <div className="rate-row"><span>Runs this month</span><b>{usage?.used_this_month} / {usage?.monthly_quota}</b></div>
                <div className="rate-row"><span>Rate limit</span><b>{usage?.rate_per_min} / min</b></div>
              </div>
              <div style={{ height: 3, background: 'var(--parchment)', borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 90 ? '#c0392b' : 'var(--plum)' }} />
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Plans</div>
              <div className="rate-box">
                <div className="rate-row"><span>Starter &mdash; 500 runs/mo</span>
                  <button className="link-btn" style={{ margin: 0 }} disabled={busy || usage?.plan === 'starter'} onClick={() => upgrade('starter')}>
                    {usage?.plan === 'starter' ? 'Current' : 'Upgrade'}
                  </button>
                </div>
                <div className="rate-row"><span>Pro &mdash; 5,000 runs/mo</span>
                  <button className="link-btn" style={{ margin: 0 }} disabled={busy || usage?.plan === 'pro'} onClick={() => upgrade('pro')}>
                    {usage?.plan === 'pro' ? 'Current' : 'Upgrade'}
                  </button>
                </div>
              </div>
              <p style={{ color: 'var(--stone)', fontSize: 11, marginTop: 8 }}>
                Checkout opens Stripe. Your plan, quota, and rate limit update automatically when payment succeeds.
              </p>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">API keys</div>
              <p style={{ color: 'var(--stone)', fontSize: 12, marginBottom: 12 }}>
                Keys are shown once at creation and stored only as a hash. Treat them like passwords.
              </p>

              {newKey && (
                <div className="login-notice" style={{ marginBottom: 12, wordBreak: 'break-all', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  New key (copy now, shown once): <strong>{newKey}</strong>
                </div>
              )}

              <button className="run-btn" onClick={createKey} disabled={busy} style={{ marginBottom: 14 }}>
                Create new key
              </button>

              <div className="rate-box">
                {keys.length === 0 && <div className="rate-row"><span>No keys yet</span></div>}
                {keys.map(k => (
                  <div className="rate-row" key={k.id}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {k.key_prefix}&hellip; {k.revoked && <em style={{ color: '#c0392b' }}>(revoked)</em>}
                    </span>
                    {!k.revoked && (
                      <button className="link-btn" style={{ margin: 0 }} onClick={() => revokeKey(k.id)} disabled={busy}>
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Quick start</div>
              <pre style={{ background: 'var(--parchment)', padding: 14, borderRadius: 3, fontSize: 11, overflowX: 'auto' }}>{`curl -s https://forge-lead-intelligence.netlify.app${API_ENDPOINT} \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"state":"Texas","country":"United States","product":"P08"}'`}</pre>
            </div>
          </>
        )}
      </div>
    </>
  )
}
