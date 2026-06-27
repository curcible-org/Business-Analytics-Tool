function IconArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

const TOOLS = [
  {
    id: 'forge',
    type: 'Lead Intelligence',
    name: 'Forge',
    desc: 'Discover and score local business prospects with a 5-stage AI pipeline. Google Places data, LLM scoring, contact enrichment.',
    stats: ['38 Leads', '11 Hot', '2h Ago'],
    status: 'active',
    view: 'forge',
  },
  {
    id: 'workflows',
    type: 'n8n Automations',
    name: 'Workflows',
    desc: 'Eight production-ready automations — email triage, lead scoring, meeting summaries, social publishing, and more. Deployed on your n8n instance.',
    stats: ['8 Workflows', 'GPT-4o', 'Done-for-you'],
    status: 'active',
    view: 'workflows',
  },
  {
    id: 'pulse',
    type: 'Client Health',
    name: 'Pulse',
    desc: 'Client health and retention tracker. Monitor engagement signals, flag at-risk accounts.',
    stats: null,
    status: 'soon',
  },
  {
    id: 'broadcast',
    type: 'Outreach',
    name: 'Broadcast',
    desc: 'Campaign builder and outreach sequencer for email and WhatsApp.',
    stats: null,
    status: 'soon',
  },
]

export default function Hub({ setCurrentView }) {
  return (
    <div className="hub">
      <div className="hub-hero">
        <div className="hub-header">
          <div className="hub-eyebrow">
            <span className="hub-eyebrow-dot" />
            Workspace Active
          </div>
          <h1 className="hub-title">Your AI studio.</h1>
          <p className="hub-subtitle">Four automation tools. One operational layer.</p>
          <div className="hub-ctas">
            <button className="hub-cta-primary" onClick={() => setCurrentView('forge')}>
              Launch Forge <IconArrow />
            </button>
            <button className="hub-cta-secondary" onClick={() => setCurrentView('workflows')}>
              View Workflows
            </button>
          </div>
        </div>
      </div>

      <div className="hub-tools-section">
        <div className="hub-tools-label-row">
          <span className="hub-tools-label">Available Tools</span>
          <span className="hub-tools-label">2 Active · 2 Coming Soon</span>
        </div>

        <div className="hub-grid">
          {TOOLS.map(tool => (
            <div
              key={tool.id}
              className={`hub-card ${tool.status === 'soon' ? 'hub-card--soon' : ''} ${tool.id === 'forge' ? 'hub-card--active-feature' : ''}`}
              onClick={() => tool.status === 'active' && setCurrentView(tool.view)}
            >
              <div className="hub-card-top">
                <span className="hub-card-type">{tool.type}</span>
                {tool.status === 'active' ? (
                  <span className="hub-card-status">
                    <span className="hub-card-status-dot" />
                    Active
                  </span>
                ) : (
                  <span className="hub-card-status hub-card-status--soon">Coming Soon</span>
                )}
              </div>

              <div className="hub-card-name">{tool.name}</div>
              <div className="hub-card-desc">{tool.desc}</div>

              {tool.stats && (
                <div className="hub-card-stats">
                  {tool.stats.map((s, i) => (
                    <span key={s}>
                      {s}
                      {i < tool.stats.length - 1 && <span className="hub-stat-sep">·</span>}
                    </span>
                  ))}
                </div>
              )}

              <div className="hub-card-footer">
                {tool.status === 'active' ? (
                  <button
                    className={`hub-launch-btn ${tool.id === 'forge' ? '' : 'hub-launch-btn--ghost'}`}
                    onClick={() => setCurrentView(tool.view)}
                  >
                    {tool.id === 'forge' ? 'Launch Forge' : 'View Workflows'} <IconArrow />
                  </button>
                ) : (
                  <span className="hub-soon-label">In Development</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hub-footer">
        <span className="hub-footer-mono">Curcible</span>
        <span className="hub-footer-sep">·</span>
        <span className="hub-footer-text">AI Automation Studio</span>
      </div>
    </div>
  )
}
