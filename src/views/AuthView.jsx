import { useState } from 'react'
import { supabase } from '../config/supabase.js'

export default function AuthView() {
  const [mode, setMode]         = useState('login') // login | signup
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [notice, setNotice]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setNotice(''); setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setNotice('Account created. If email confirmation is on, check your inbox, then sign in.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // onAuthStateChange in App handles the redirect.
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand-wordmark" style={{ fontSize: 22, marginBottom: 4 }}>
          C<span className="brand-wordmark-plum">ur</span>cible<span className="brand-wordmark-plum">.</span>
        </div>
        <div className="brand-sub" style={{ marginBottom: 22 }}>Forge &mdash; Lead Intelligence</div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com" autoComplete="email" required
            className="login-input"
          />
          <label className="login-label" style={{ marginTop: 12 }}>Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required minLength={8} className="login-input"
          />

          {error && <div className="login-error">{error}</div>}
          {notice && <div className="login-notice">{notice}</div>}

          <button type="submit" className="run-btn" style={{ width: '100%', marginTop: 18 }} disabled={loading}>
            {loading ? 'Working&hellip;' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          className="link-btn"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice('') }}
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
