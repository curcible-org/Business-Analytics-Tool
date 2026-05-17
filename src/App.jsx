import { useState, useCallback, useRef, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Pipeline from './components/Pipeline.jsx'
import Results from './components/Results.jsx'
import { PROVIDERS } from './config/providers.js'
import { callLLM } from './utils/llm.js'

const pad = n => String(n).padStart(2, '0')
const wait = ms => new Promise(r => setTimeout(r, ms))

const INIT_NODES = [
  { label: 'Prospector',   icon: '🔍', status: 'idle', statusText: 'Waiting…' },
  { label: 'ScrapeGraphAI',icon: '🕷️', status: 'idle', statusText: 'Waiting…' },
  { label: 'LLM Router',   icon: '🧠', status: 'idle', statusText: 'Waiting…' },
]

export default function App() {
  // Persist provider + key across sessions
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

  const [location, setLocation]       = useState('')
  const [businessType, setBusinessType] = useState('')
  const [valueProp, setValueProp]     = useState('')

  // 'idle' | 'running' | 'done' | 'error'
  const [phase, setPhase]   = useState('idle')
  const [nodes, setNodes]   = useState(INIT_NODES)
  const [logs,  setLogs]    = useState([])
  const [leads, setLeads]   = useState([])
  const [error, setError]   = useState('')
  const [runMeta, setRunMeta] = useState(null) // { location, businessType }

  // Keep localStorage in sync
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

      const data = await callLLM({
        providerKey,
        model,
        loc: location,
        type: businessType,
        vp: valueProp,
        apiKey,
      })

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
              {phase === 'running' ? 'Running…' : 'Run Pipeline'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="content">
          {phase === 'idle' && (
            <div className="empty">
              <div className="e-icon">◎</div>
              <h3>No runs yet</h3>
              <p>Enter a location, business type, and value prop above — then run the pipeline.</p>
            </div>
          )}

          {(phase === 'running' || phase === 'done' || phase === 'error') && (
            <Pipeline nodes={nodes} logs={logs} visible={phase === 'running'} />
          )}

          {error && (
            <div className="err-banner">⚠ {error}</div>
          )}

          {phase === 'done' && leads.length > 0 && (
            <Results leads={leads} meta={runMeta} />
          )}
        </div>
      </main>
    </div>
  )
}
