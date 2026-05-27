import Pipeline from '../components/Pipeline.jsx'
import Results from '../components/Results.jsx'
import { BLUEPRINT_PRODUCTS } from '../config/products.js'

const selectStyle = {
  height: '36px',
  padding: '0 10px',
  background: 'var(--warm-paper)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  color: 'var(--ink)',
  fontSize: '13px',
  fontFamily: 'inherit',
  cursor: 'pointer',
  width: '100%',
}

export default function ForgeView({
  locationState, setLocationState,
  locationCountry, setLocationCountry,
  blueprintProduct, setBlueprintProduct,
  phase, nodes, logs, leads, error, runMeta,
  run,
}) {
  const progressPct = phase === 'running' || phase === 'done'
    ? Math.round((nodes.filter(n => n.status === 'done').length / nodes.length) * 100)
    : 0

  return (
    <>
      <div className="main-head">
        <h1>Forge<em> — Lead Intelligence</em></h1>
        <p>
          Finds businesses in your target market that need your Blueprint product, scores
          them Hot / Warm / Low, and estimates buy probability. Runs on free LLM tiers.
        </p>
      </div>

      <div className="search-bar">
        <div className="sf">
          <label>State / Province</label>
          <input
            type="text"
            value={locationState}
            onChange={e => setLocationState(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="Texas"
          />
        </div>
        <div className="sf">
          <label>Country</label>
          <input
            type="text"
            value={locationCountry}
            onChange={e => setLocationCountry(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="United States"
          />
        </div>
        <div className="sf" style={{ minWidth: 260 }}>
          <label>Blueprint Product to Sell</label>
          <select
            value={blueprintProduct}
            onChange={e => setBlueprintProduct(e.target.value)}
            style={selectStyle}
          >
            {BLUEPRINT_PRODUCTS.map(p => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.name}: {p.desc}
              </option>
            ))}
          </select>
        </div>
        <div className="sf">
          <label>&nbsp;</label>
          <button className="run-btn" onClick={run} disabled={phase === 'running'}>
            {phase === 'running' ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Running…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>
                </svg>
                Run Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      <div className="content">
        {phase === 'idle' && (
          <div className="empty">
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
            <p>Enter a state, country, and Blueprint product — then run the pipeline.</p>
          </div>
        )}

        {(phase === 'running' || phase === 'done' || phase === 'error') && (
          <Pipeline nodes={nodes} logs={logs} visible={phase === 'running'} progressPct={progressPct} />
        )}

        {error && (
          <div className="err-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {phase === 'done' && leads.length > 0 && (
          <Results leads={leads} meta={runMeta} />
        )}
      </div>
    </>
  )
}
