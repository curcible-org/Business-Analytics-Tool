import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

function Wordmark() {
  return (
    <Link to="/" className="site-wordmark">
      C<span>ur</span>cible<span>.</span>
    </Link>
  )
}

export default function SiteLayout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="site">
      <nav className="site-nav">
        <Wordmark />
        <div className="site-nav-links">
          <NavLink to="/" end>Home</NavLink>
          <Link to="/#products">Products</Link>
          <a href="/plan.html">Plan</a>
          <a href="/api.html">API</a>
          <Link to="/app" className="site-nav-cta">Launch Forge</Link>
        </div>
      </nav>

      <Outlet />

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-col">
            <Wordmark />
            <p className="site-footer-tag">Automation, forged.</p>
          </div>
          <div className="site-footer-col">
            <span className="site-footer-label">Products</span>
            <Link to="/products/inboxcore">InboxCore™</Link>
            <Link to="/products/contentcore">ContentCore™</Link>
            <Link to="/products/leadcore">LeadCore™</Link>
            <Link to="/products/postcore">PostCore™</Link>
          </div>
          <div className="site-footer-col">
            <span className="site-footer-label">&nbsp;</span>
            <Link to="/products/reportcore">ReportCore™</Link>
            <Link to="/products/knowcore">KnowCore™</Link>
            <Link to="/products/meetcore">MeetCore™</Link>
            <Link to="/products/schedcore">SchedCore™</Link>
          </div>
          <div className="site-footer-col">
            <span className="site-footer-label">Company</span>
            <Link to="/app">Forge — Lead Intelligence</Link>
            <a href="/plan.html">Implementation Plan</a>
            <a href="/api.html">API Documentation</a>
            <a href="mailto:info@curcible.com">info@curcible.com</a>
          </div>
        </div>
        <div className="site-footer-base">
          <span>CURCIBLE — AI AUTOMATION STUDIO</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
