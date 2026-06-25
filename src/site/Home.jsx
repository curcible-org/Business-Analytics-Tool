import { Link } from 'react-router-dom'
import { CATALOG, HERO_IMAGE } from '../config/catalog.js'

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

export default function Home() {
  return (
    <main className="site-main">
      {/* ── Hero ── */}
      <section className="site-hero">
        <div className="site-eyebrow">AI Automation Studio</div>
        <h1 className="site-h1">Automation, forged.</h1>
        <p className="site-lede">
          Eight production-ready n8n automations for SMBs. Email triage, content, lead
          qualification, social publishing, reporting, support, meetings, and scheduling —
          delivered as import-ready workflows. One-time purchase. No subscription.
        </p>
        <div className="site-hero-actions">
          <a href="#products" className="site-btn site-btn--primary">View products <Arrow /></a>
          <Link to="/app" className="site-btn">Launch Forge</Link>
        </div>
        <div className="site-stats">
          <div className="site-stat"><span className="site-stat-n">8</span><span className="site-stat-l">Products</span></div>
          <div className="site-stat"><span className="site-stat-n">101</span><span className="site-stat-l">Workflow nodes</span></div>
          <div className="site-stat"><span className="site-stat-n">1–6h</span><span className="site-stat-l">Setup time</span></div>
          <div className="site-stat"><span className="site-stat-n">$0</span><span className="site-stat-l">Monthly fees</span></div>
        </div>
        <div className="site-hero-visual">
          <img src={HERO_IMAGE} alt="AI automation studio illustration" loading="lazy" />
        </div>
      </section>

      {/* ── Products ── */}
      <section id="products" className="site-section site-section--tinted">
        <div className="site-section-head">
          <div className="site-eyebrow">The Suite</div>
          <h2 className="site-h2">Eight automations. One operating layer.</h2>
        </div>
        <div className="site-product-grid">
          {CATALOG.map(p => (
            <Link key={p.id} to={`/products/${p.slug}`} className="site-product-card">
              {p.image && (
                <div className="site-card-img">
                  <img src={p.image} alt={p.name} loading="lazy" />
                </div>
              )}
              <div className="site-card-top">
                <span className="site-tag">{p.category}</span>
                <span className="site-card-price">${p.price}</span>
              </div>
              <div className="site-card-name">{p.name}</div>
              <div className="site-card-tagline">{p.tagline}</div>
              <p className="site-card-desc">{p.pitch}</p>
              <div className="site-card-meta">
                <span>{p.nodes} nodes</span><span>·</span>
                <span>{p.setup} setup</span><span>·</span>
                <span>{p.complexity}</span>
              </div>
              <span className="site-card-link">Details <Arrow /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Forge ── */}
      <section className="site-section">
        <div className="site-split">
          <div>
            <div className="site-eyebrow">Free Tool</div>
            <h2 className="site-h2">Forge — Lead Intelligence Engine</h2>
            <p className="site-body">
              Find local businesses that need your product. Forge runs a discovery, validation,
              enrichment, and reachability pipeline, then scores every lead Hot / Warm / Low / Skip
              with AI intelligence. Bring your own LLM key — zero inference cost.
            </p>
            <Link to="/app" className="site-btn site-btn--primary">Launch Forge <Arrow /></Link>
          </div>
          <ul className="site-list">
            <li>Places or LLM-based business discovery</li>
            <li>Format validation, identity check, contact enrichment</li>
            <li>Reachability verification before outreach</li>
            <li>CSV export and copy-ready outreach angles</li>
          </ul>
        </div>
      </section>

      {/* ── Plan + API ── */}
      <section className="site-section site-section--tinted">
        <div className="site-duo">
          <a href="/plan.html" className="site-duo-card">
            <span className="site-tag">Strategy</span>
            <h3 className="site-h3">Implementation Plan</h3>
            <p className="site-body">
              The 8-product sequential roadmap. Phase-by-phase build order with priorities,
              timelines, and dependencies — from first workflow to full suite.
            </p>
            <span className="site-card-link">View plan <Arrow /></span>
          </a>
          <a href="/api.html" className="site-duo-card">
            <span className="site-tag">Developers</span>
            <h3 className="site-h3">Forge API</h3>
            <p className="site-body">
              Programmatic access to the lead pipeline. REST endpoints for lead generation and
              health checks, with webhook delivery for purchases and onboarding.
            </p>
            <span className="site-card-link">Read docs <Arrow /></span>
          </a>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="site-section">
        <div className="site-section-head">
          <div className="site-eyebrow">Pricing</div>
          <h2 className="site-h2">Buy once. Run forever.</h2>
        </div>
        <div className="site-pricing">
          <div className="site-price-card">
            <span className="site-tag">Standard</span>
            <div className="site-price-n">$79</div>
            <p className="site-body">Per product, one-time. 7 of 8 products. Import-ready n8n JSON with README and credentials guide.</p>
          </div>
          <div className="site-price-card">
            <span className="site-tag">Advanced</span>
            <div className="site-price-n">$99</div>
            <p className="site-body">KnowCore™ — WhatsApp RAG chatbot with Pinecone vector search and ingestion tooling included.</p>
          </div>
          <div className="site-price-card">
            <span className="site-tag">Done-For-You</span>
            <div className="site-price-n">Custom</div>
            <p className="site-body">Full setup, credential wiring, and customisation handled by Curcible. Setup completed in days, not weeks.</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="site-cta">
        <h2 className="site-h2">Ready to remove the manual work?</h2>
        <p className="site-body">Questions on fit, setup, or custom builds — one email away.</p>
        <a href="mailto:info@curcible.com" className="site-btn site-btn--primary">Contact Curcible <Arrow /></a>
      </section>
    </main>
  )
}
