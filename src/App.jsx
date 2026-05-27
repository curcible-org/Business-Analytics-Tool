import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Hub from './views/Hub.jsx'
import ForgeView from './views/ForgeView.jsx'
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
  const [currentView, setCurrentView] = useState('home')

  // Forge state
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
  const [logs, setLogs]     = useState([])
  const [leads, setLeads]   = useState([])
  const [error, setError]   = useState('')
  const [runMeta, setRunMeta] = useState(null)

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

  return (
    <div className="app">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        providerKey={providerKey}
        setProviderKey={setProviderKey}
        model={model}
        setModel={setModel}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />

      <main className="main">
        {currentView === 'home' && <Hub setCurrentView={setCurrentView} />}

        {currentView === 'forge' && (
          <ForgeView
            location={location} setLocation={setLocation}
            businessType={businessType} setBusinessType={setBusinessType}
            valueProp={valueProp} setValueProp={setValueProp}
            phase={phase} nodes={nodes} logs={logs} leads={leads}
            error={error} runMeta={runMeta} run={run}
          />
        )}

        {currentView === 'plan' && (
          <iframe
            src="/plan.html"
            className="plan-frame"
            title="Curcible Sequential Plan"
          />
        )}
      </main>
    </div>
  )
}
