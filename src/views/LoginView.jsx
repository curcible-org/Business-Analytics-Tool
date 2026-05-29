import { useState } from 'react'

// Set VITE_APP_PASS in your .env.local to change the password
const APP_PASS = import.meta.env.VITE_APP_PASS || 'curcible'

export default function LoginView({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(false)
  const [loading, setLoading]   = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (password === APP_PASS) {
        onLogin()
      } else {
        setError(true)
        setPassword('')
        setLoading(false)
      }
    }, 320) // brief delay feels intentional
  }

  return (
    <div className="login">
      <div className="login-box">
        <div className="login-wordmark">
          C<span>ur</span>cible<span>.</span>
        </div>
        <div className="login-sub">Workspace</div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Password</label>
            <div className="key-wrap">
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false) }}
                placeholder="Enter workspace password…"
                autoFocus
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="login-err">Incorrect password. Try again.</div>
          )}

          <button className="login-btn" type="submit" disabled={loading || !password}>
            {loading ? 'Verifying…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
