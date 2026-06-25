import { Link, useParams, Navigate } from 'react-router-dom'
import { CATALOG, getProduct } from '../config/catalog.js'

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

export default function ProductPage() {
  const { slug } = useParams()
  const p = getProduct(slug)
  if (!p) return <Navigate to="/" replace />

  const others = CATALOG.filter(x => x.slug !== slug).slice(0, 3)

  return (
    <main className="site-main">
      <section className="site-hero site-hero--product">
        <Link to="/#products" className="site-back">← All products</Link>
        <div className="site-eyebrow">{p.id} · {p.category}</div>
        <h1 className="site-h1">{p.name}</h1>
        <p className="site-lede">{p.tagline} — {p.pitch}</p>
        <div className="site-hero-actions">
          <a href={p.gumroad} target="_blank" rel="noreferrer" className="site-btn site-btn--primary">
            Buy — ${p.price} one-time <Arrow />
          </a>
          <a href="mailto:info@curcible.com" className="site-btn">Ask a question</a>
        </div>
        <div className="site-stats">
          <div className="site-stat"><span className="site-stat-n">{p.nodes}</span><span className="site-stat-l">Workflow nodes</span></div>
          <div className="site-stat"><span className="site-stat-n">{p.setup}</span><span className="site-stat-l">Setup time</span></div>
          <div className="site-stat"><span className="site-stat-n">{p.complexity}</span><span className="site-stat-l">Complexity</span></div>
          <div className="site-stat"><span className="site-stat-n">${p.price}</span><span className="site-stat-l">One-time</span></div>
        </div>
        {p.image && (
          <div className="site-product-img">
            <img src={p.image} alt={p.name} loading="lazy" />
          </div>
        )}
      </section>

      <section className="site-section site-section--tinted">
        <div className="site-split">
          <div>
            <div className="site-eyebrow">What it does</div>
            <h2 className="site-h2">Pipeline overview</h2>
            <p className="site-body">{p.description}</p>
            <p className="site-body site-body--muted">Running cost: {p.runningCost}</p>
          </div>
          <div>
            <div className="site-eyebrow">Features</div>
            <ul className="site-list">
              {p.features.map(f => <li key={f}>{f}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-split">
          <div>
            <div className="site-eyebrow">Required credentials</div>
            <div className="site-cred-tags">
              {p.credentials.map(c => <span key={c} className="site-tag">{c}</span>)}
            </div>
          </div>
          <div>
            <div className="site-eyebrow">Best for</div>
            <ul className="site-list">
              {p.bestFor.map(b => <li key={b}>{b}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="site-section site-section--tinted">
        <div className="site-section-head">
          <div className="site-eyebrow">Also in the suite</div>
        </div>
        <div className="site-product-grid site-product-grid--3">
          {others.map(o => (
            <Link key={o.id} to={`/products/${o.slug}`} className="site-product-card">
              <div className="site-card-top">
                <span className="site-tag">{o.category}</span>
                <span className="site-card-price">${o.price}</span>
              </div>
              <div className="site-card-name">{o.name}</div>
              <div className="site-card-tagline">{o.tagline}</div>
              <span className="site-card-link">Details <Arrow /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-cta">
        <h2 className="site-h2">Delivered as import-ready n8n JSON.</h2>
        <p className="site-body">Includes README.md, CREDENTIALS.md, and full documentation.</p>
        <a href={p.gumroad} target="_blank" rel="noreferrer" className="site-btn site-btn--primary">
          Get {p.name} — ${p.price} <Arrow />
        </a>
      </section>
    </main>
  )
}
