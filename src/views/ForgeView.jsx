import { useRef, useEffect } from 'react'
import Results from '../components/Results.jsx'
import { BLUEPRINT_PRODUCTS } from '../config/products.js'
import { PROVIDERS } from '../config/providers.js'

function IconPlay() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

const STAGE_LABELS = ['Places', 'Score', 'Validate', 'Enrich', 'Reachability']

function HorizontalPipeline({ nodes, logs, phase, progressPct }) {
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const activeIdx = nodes.findIndex(n => n.status === 'active')
  const doneCount = nodes.filter(n => n.status === 'done').length

  const statusText = phase === 'running'
    ? (activeIdx >= 0 ? `Stage ${activeIdx + 1} of ${nodes.length} · ${nodes[activeIdx]?.statusText}` : 'Running…')
    : phase === 'done'
    ? `Complete · ${doneCount} of ${nodes.length} stages`
    : ''

  return (
    <>
      <div className="hpipe">
        <div className="hpipe-stages">
          {nodes.map((node, i) => {
            const stageClass = node.status === 'done' ? 'hpipe-stage--done'
              : node.status === 'active' ? 'hpipe-stage--active'
              : ''
            const dotClass = node.status === 'done' ? 'hpipe-dot--done'
              : node.status === 'active' ? 'hpipe-dot--active'
              : ''
            return (
              <div key={node.label} className={`hpipe-stage ${stageClass}`}>
                <div className="hpipe-node">
                  <div className={`hpipe-dot ${dotClass}`}>
                    {node.status === 'done' && <IconCheck />}
                    {node.status === 'active' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--paper)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    )}
                  </div>
                  <span className="hpipe-label">{STAGE_LABELS[i] || node.label}</span>
                </div>
                {i < nodes.length - 1 && (
                  <div className={`hpipe-line ${node.status === 'done' ? 'hpipe-line--done' : ''}`} />
                )}
              </div>
            )
          })}
        </div>
        {statusText && <div className="hpipe-status">{statusText}</div>}
      </div>

      {/* Log strip — only visible while running */}
      {phase === 'running' && logs.length > 0 && (
        <div style={{
          background: 'var(--warm-paper)',
          borderBottom: '1px solid var(--border)',
          padding: '10px 28px',
          maxHeight: 120,
          overflowY: 'auto',
          flexShrink: 0,
        }} ref={logRef}>
          {logs.map(entry => (
            <div key={entry.id} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: entry.ok ? '#2D6A4F' : 'var(--stone)',
              lineHeight: 1.8,
            }}>
              <span style={{ color: 'var(--ghost)', marginRight: 12, userSelect: 'none' }}>{entry.ts}</span>
              {entry.msg}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function ForgeView({
  locationState, setLocationState,
  locationCountry, setLocationCountry,
  blueprintProduct, setBlueprintProduct,
  phase, nodes, logs, leads, error, runMeta,
  run,
  providerKey, model,
}) {
  const provider   = PROVIDERS[providerKey]
  const modelName  = provider?.models.find(m => m.id === model)?.name || model
  const hotCount   = leads.filter(l => l.score === 'hot').length
  const warmCount  = leads.filter(l => l.score === 'warm').length
  const webResolving = leads.filter(l => l.web_verified === true).length
  const progressPct = (phase === 'running' || phase === 'done')
    ? Math.round((nodes.filter(n => n.status === 'done').length / nodes.length) * 100)
    : 0

  const showPipeline = phase === 'running' || phase === 'done' || phase === 'error'

  return (
    <div className="forge-layout">
      {/* ── Left panel ── */}
      <aside className="forge-panel">
        <div className="forge-panel-head">Search parameters</div>

        <div className="forge-panel-body">
          <div className="fp-field">
            <label className="fp-label">State / Province</label>
            <input
              className="fp-input"
              type="text"
              value={locationState}
              onChange={e => setLocationState(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && run()}
              placeholder="e.g. Texas"
            />
          </div>

          <div className="fp-field">
            <label className="fp-label">Country</label>
            <input
              className="fp-input"
              type="text"
              value={locationCountry}
              onChange={e => setLocationCountry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && run()}
              placeholder="e.g. United States"
            />
          </div>

          <div className="fp-field">
            <label className="fp-label">Target Product</label>
            <select
              className="fp-select"
              value={blueprintProduct}
              onChange={e => setBlueprintProduct(e.target.value)}
            >
              {BLUEPRINT_PRODUCTS.map(p => (
                <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
              ))}
            </select>
          </div>

          <button
            className="forge-run-btn"
            onClick={run}
            disabled={phase === 'running'}
          >
            {phase === 'running' ? <><IconSpinner /> Running…</> : <><IconPlay /> Run pipeline</>}
          </button>

          {runMeta && phase === 'done' && (
            <div className="fp-last-run" style={{ marginTop: 10 }}>
              Last run · {leads.length} leads
              {runMeta.isSample && ' · sample data'}
            </div>
          )}
        </div>

        <div className="forge-panel-footer">
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--stone)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            AI Provider
          </div>
          <div className="fp-provider-chip">
            <span className="fp-provider-dot" />
            <span className="fp-provider-name">{provider?.label}</span>
            <span className="fp-provider-model">{modelName}</span>
          </div>
        </div>
      </aside>

      {/* ── Right content ── */}
      <div className="forge-content">
        {/* Pipeline stepper — shown while running or done */}
        {showPipeline && (
          <HorizontalPipeline
            nodes={nodes}
            logs={logs}
            phase={phase}
            progressPct={progressPct}
          />
        )}

        {/* Error banner */}
        {error && (
          <div className="err-banner" style={{ margin: '20px 28px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Sample data notice */}
        {phase === 'done' && runMeta?.isSample && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            margin: '0', padding: '10px 28px',
            background: 'var(--plum-pale)', borderBottom: '1px solid var(--plum-pale2)',
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--plum)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Sample data — sign in and run a search to fetch real, server-sourced leads.
          </div>
        )}

        {/* Metrics row — only when done */}
        {phase === 'done' && leads.length > 0 && (
          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-n">{leads.length}</div>
              <div className="metric-l">Leads found</div>
            </div>
            <div className="metric-card">
              <div className={`metric-n ${hotCount > 0 ? 'metric-n--plum' : ''}`}>{hotCount}</div>
              <div className="metric-l">Hot leads</div>
            </div>
            <div className="metric-card">
              <div className="metric-n">{warmCount}</div>
              <div className="metric-l">Warm leads</div>
            </div>
            <div className="metric-card">
              <div className="metric-n">
                {leads.length > 0 ? Math.round((webResolving / leads.length) * 100) : 0}%
              </div>
              <div className="metric-l">Web resolving</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {phase === 'idle' && (
          <div className="forge-empty">
            <div className="empty-rings">
              <div className="ring ring-1" />
              <div className="ring ring-2" />
              <div className="ring ring-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
            </div>
            <h3>No runs yet</h3>
            <p>Enter a location and target product, then run the pipeline.</p>
          </div>
        )}

        {/* Results */}
        {phase === 'done' && leads.length > 0 && (
          <div className="content" style={{ flex: 1 }}>
            <Results leads={leads} meta={runMeta} />
          </div>
        )}

        {phase === 'done' && leads.length === 0 && !error && (
          <div className="forge-empty">
            <h3>No results</h3>
            <p>The pipeline ran but found no hot + verified leads. Try a different location or product.</p>
          </div>
        )}
      </div>
    </div>
  )
}
