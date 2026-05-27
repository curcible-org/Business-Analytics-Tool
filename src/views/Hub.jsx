const PRODUCTS = [
  {
    id: 'forge',
    tag: 'Lead Intelligence',
    name: 'Forge',
    desc: 'Find local businesses that need your product. Enriched with AI intelligence and scored Hot / Warm / Low / Skip.',
    status: 'active',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        <path d="M11 8v3l2 2"/>
      </svg>
    ),
  },
  {
    id: 'plan',
    tag: 'Strategy',
    name: 'Blueprint',
    desc: '8-product sequential implementation roadmap. Phase-by-phase build plan with priorities, timelines, and dependencies.',
    status: 'active',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    id: 'soon-1',
    tag: 'Coming Soon',
    name: 'Pulse',
    desc: 'Client health and retention tracker. Monitor engagement signals, flag at-risk accounts, automate check-ins.',
    status: 'soon',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: 'soon-2',
    tag: 'Coming Soon',
    name: 'Broadcast',
    desc: 'Campaign builder and outreach sequencer. Write, schedule, and track cold outreach across email and WhatsApp.',
    status: 'soon',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.63 5 2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.83-.83a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.18v-.26"/>
        <path d="M16 2a4 4 0 0 1 4 4"/>
        <path d="M16 6a0 0 0 0 1 0 0"/>
      </svg>
    ),
  },
]

function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

export default function Hub({ setCurrentView }) {
  return (
    <div className="hub">
      <div className="hub-header">
        <div className="hub-eyebrow">Internal Workspace</div>
        <h1 className="hub-title">Internal tools.</h1>
        <p className="hub-subtitle">
          Operational tooling for lead generation, strategy, and business development. Select a product.
        </p>
      </div>

      <div className="hub-grid">
        {PRODUCTS.map(p => (
          <div
            key={p.id}
            className={`hub-card ${p.status === 'soon' ? 'hub-card--soon' : ''}`}
            onClick={() => p.status === 'active' && setCurrentView(p.id)}
          >
            <div className="hub-card-top">
              <div className="hub-card-icon">{p.icon}</div>
              <span className="hub-card-tag">{p.tag}</span>
            </div>
            <div className="hub-card-body">
              <div className="hub-card-name">{p.name}</div>
              <div className="hub-card-desc">{p.desc}</div>
            </div>
            <div className="hub-card-footer">
              {p.status === 'active' ? (
                <button className="hub-launch-btn" onClick={() => setCurrentView(p.id)}>
                  Launch <ArrowRight />
                </button>
              ) : (
                <span className="hub-soon-label">In development</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="hub-footer">
        <span className="hub-footer-mono">CURCIBLE</span>
        <span className="hub-footer-sep">·</span>
        <span className="hub-footer-text">Internal workspace</span>
      </div>
    </div>
  )
}
