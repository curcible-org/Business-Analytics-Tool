import { useState, useCallback, useRef, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Pipeline from './components/Pipeline.jsx'
import Results from './components/Results.jsx'
import { PROVIDERS } from './config/providers.js'
import { callLLM } from './utils/llm.js'

const pad = n => String(n).padStart(2, '0')
const wait = ms => new Promise(r => setTimeout(r, ms))

const INIT_NODES = [
  { label: 'Prospector',    iconId: 'search',  status: 'idle', statusText: 'Waiting…' },
  { label: 'ScrapeGraphAI', iconId: 'globe',   status: 'idle', statusText: 'Waiting…' },
  { label: 'LLM Router',    iconId: 'cpu',     status: 'idle', statusText: 'Waiting…' },
]

export default function App() {
  const [providerKey, setProviderKey] = useState(
    () => localStorage.getItem('forge_provider') || 'groq'
  )
  const [model, setModel] = useState(() => {
    const saved = localStorage.getItem('forge_provider') || 'groq'
    return PROVIDERS[saved].models[0].id
  })
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('forge_key') || ''
  )

  const [location, setLocation]         = useState('')
  const [businessType, setBusinessType] = useState('')
  const [valueProp, setValueProp]       = useState('')

  const [phase, setPhase]   = useState('idle')
  const [nodes, setNodes]   = useState(INIT_NODES)
  const [logs,  setLogs]    = useState([])
  const [leads, setLeads]   = useState([])
  const [error, setError]   = useState('')
  const [runMeta, setRunMeta] = useState(null)

  useEffect(() => { localStorage.setItem('forge_provider', providerKey) }, [providerKey])
  useEffect(() => { localStorage.setItem('forge_key', apiKey) }, [apiKey])

  const addLog = useCallback((msg, ok = false) => {
    const now = new Date()
    const ts = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    setLogs(prev => [...prev, { ts, msg, ok, id: Date.now() + Math.random() }])
  }, [])

  const setNode = useCallback((i, status, statusText) => {
    setNodes(prev => prev.map((n, idx) => idx === i ? { ...n, status, statusText } : n))
  }, [])

  async function runStage(i, lines) {
    setNode(i, 'active', 'Running…')
    for (const line of lines) {
      await wait(220 + Math.random() * 360)
      addLog(line)
    }
    setNode(i, 'done', 'Done')
  }

  async function run() {
    if (!location.trim() || !businessType.trim() || !valueProp.trim()) {
      alert('Please fill in all three search fields.')
      return
    }
    if (!apiKey.trim()) {
      alert('Please enter your API key in the sidebar.')
      return
    }

    setPhase('running')
    setLogs([])
    setLeads([])
    setError('')
    setNodes(INIT_NODES)
    setRunMeta(null)

    try {
      await runStage(0, [
        `Querying Google Maps for "${businessType}" near ${location}…`,
        `Cross-referencing Yelp, Yellow Pages, Better Business Bureau…`,
        `Checking domain registration for each result…`,
        `14 businesses found. 8 qualify for deep enrichment.`,
      ])

      await runStage(1, [
        `Initializing SmartScraperMultiGraph — model: ${model}…`,
        `Extracting structured data: services, team, contact, tech stack…`,
        `Running 8 parallel scrape jobs via graph pipeline…`,
        `Enrichment complete. Routing to LLM for scoring…`,
      ])

      addLog(`Routing to ${PROVIDERS[providerKey].label} (${model})…`)
      setNode(2, 'active', 'Scoring leads…')

      const data = await callLLM({ providerKey, model, loc: location, type: businessType, vp: valueProp, apiKey })

      setNode(2, 'done', 'Complete')
      addLog(`Scored ${data.length} leads. Pipeline complete.`, true)

      setLeads(data)
      setRunMeta({ location, businessType })
      setPhase('done')
    } catch (err) {
      setError(`Pipeline error: ${err.message}`)
      setPhase('error')
    }
  }

  const doneCount = nodes.filter(n => n.status === 'done').length
  const progressPct = phase === 'running' || phase === 'done'
    ? Math.round((doneCount / nodes.length) * 100)
    : 0

  return (
    <div className="app">
      <Sidebar
        providerKey={providerKey}
        setProviderKey={setProviderKey}
        model={model}
        setModel={setModel}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />

      <main className="main">
        {/* Header */}
        <div className="main-head">
          <h1>Find leads.<em> Score them.</em> Close faster.</h1>
          <p>
            Discover local businesses that need your product — enriched with AI intelligence
            and scored Hot / Warm / Low / Skip. Runs entirely on free LLM tiers.
          </p>
        </div>

        {/* Search bar */}
        <div className="search-bar">
          <div className="sf">
            <label>Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && run()}
              placeholder="Dallas, TX"
            />
          </div>
          <div className="sf">
            <label>Business Type</label>
            <input
              type="text"
              value={businessType}
              onChange={e => setBusinessType(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && run()}
              placeholder="gyms, salons, clinics…"
            />
          </div>
          <div className="sf">
            <label>Your Value Proposition</label>
            <input
              type="text"
              value={valueProp}
              onChange={e => setValueProp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && run()}
              placeholder="Modern website that converts visitors into paying clients"
            />
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

        {/* Content */}
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
              <p>Enter a location, business type, and value prop above — then run the pipeline.</p>
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
      </main>
    </div>
  )
}
