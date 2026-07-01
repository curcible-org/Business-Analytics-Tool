import { useState, useCallback, useEffect } from 'react'
import TopNav from './components/TopNav.jsx'
import Hub from './views/Hub.jsx'
import ForgeView from './views/ForgeView.jsx'
import SettingsView from './views/SettingsView.jsx'
import AuthView from './views/AuthView.jsx'
import AccountView from './views/AccountView.jsx'
import WorkflowsView from './views/WorkflowsView.jsx'
import { supabase } from './config/supabase.js'
import { PROVIDERS } from './config/providers.js'
import { BLUEPRINT_PRODUCTS } from './config/products.js'
import { loadEnrichUsage } from './utils/enrichUsage.js'
import { SAMPLE_LEADS, SAMPLE_RUN_META } from './config/sampleLeads.js'

// Hosted, server-held pipeline. All provider keys (Google Places, LLM,
// enrichment) live in Netlify env — the browser never holds them. The app
// authenticates with a per-tenant Forge API key (auto-provisioned via Supabase)
// and the server returns ToS-safe leads (place_id + Maps link + intelligence).
const API_ENDPOINT = '/api/v1/leads'
const INAPP_KEY_STORAGE = 'forge_inapp_key'

// Map the server's ToS-safe lead → the field names the Results UI + CSV expect.
function mapSafeLead(l) {
  return {
    places_id:        l.place_id,
    maps_url:         l.maps_url,
    industry:         l.industry,
    score:            l.score,
    buy_probability:  l.buy_probability,
    pain_points:      l.pain_points || [],
    problem_solved:   l.problem_solved,
    sale_strategy:    l.sale_strategy,
    recommended_products: l.recommended_products || [],
    website_quality:  l.website_quality,
    email:            l.email || null,
    email_source:     l.email_source || null,
    email_deliverable: l.email_deliverable ?? null,
    web_verified:     l.web_reachable,
    confidence:       l.confidence,
    notes:            l.compliance_note || '',
    is_sample:        false,
  }
}

const pad = n => String(n).padStart(2, '0')
const wait = ms => new Promise(r => setTimeout(r, ms))
const TODAY = () => new Date().toISOString().slice(0, 10)

function loadUsage(providerKey) {
  try {
    const raw = JSON.parse(localStorage.getItem('forge_usage') || '{}')
    if (raw.date === TODAY() && raw.provider === providerKey)
      return { requests: raw.requests || 0, totalTokens: raw.totalTokens || 0 }
  } catch {}
  return { requests: 0, totalTokens: 0 }
}

function saveUsage(providerKey, usage) {
  localStorage.setItem('forge_usage', JSON.stringify({ date: TODAY(), provider: providerKey, ...usage }))
}

// Single real pipeline: Google Places is the only lead source. The former
// LLM-only "discovery" path invented businesses (fabricated PII) and was removed.
// The Clearbit "Identity Check" stage was removed (dead dependency).
const NODES_PLACES = [
  { label: 'Places Discovery',   iconId: 'map-pin',  status: 'idle', statusText: 'Waiting…' },
  { label: 'LLM Intelligence',   iconId: 'cpu',      status: 'idle', statusText: 'Waiting…' },
  { label: 'Format Validation',  iconId: 'check',    status: 'idle', statusText: 'Waiting…' },
  { label: 'Contact Enrichment', iconId: 'mail',     status: 'idle', statusText: 'Waiting…' },
  { label: 'Reachability',       iconId: 'shield',   status: 'idle', statusText: 'Waiting…' },
]

export default function App() {
  // ── Auth (Supabase) ─────────────────────────────────────────────────────────
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
  }

  // ── View ──────────────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState('home')

  // ── LLM provider state ────────────────────────────────────────────────────
  const [providerKey, setProviderKeyState] = useState(
    () => localStorage.getItem('forge_provider') || 'groq'
  )
  const [model, setModelState] = useState(() => {
    const saved = localStorage.getItem('forge_provider') || 'groq'
    return localStorage.getItem('forge_model') || PROVIDERS[saved].models[0].id
  })
  const [apiKey, setApiKeyState] = useState(
    () => localStorage.getItem('forge_key') || ''
  )

  function setProviderKey(key) {
    setProviderKeyState(key)
    setModelState(PROVIDERS[key].models[0].id)
    localStorage.setItem('forge_provider', key)
    localStorage.removeItem('forge_model')
    setUsageToday(loadUsage(key))
  }
  function setModel(v)  { setModelState(v);  localStorage.setItem('forge_model', v) }
  function setApiKey(v) { setApiKeyState(v); localStorage.setItem('forge_key', v) }

  // ── Enrichment keys ───────────────────────────────────────────────────────
  const [abstractEmailKey, setAbstractEmailKeyState] = useState(
    () => localStorage.getItem('forge_abstract_email_key') || ''
  )
  const [abstractPhoneKey, setAbstractPhoneKeyState] = useState(
    () => localStorage.getItem('forge_abstract_phone_key') || ''
  )
  const [hunterApiKey, setHunterApiKeyState] = useState(
    () => localStorage.getItem('forge_hunter_key') || ''
  )
  const [googlePlacesKey, setGooglePlacesKeyState] = useState(
    () => localStorage.getItem('forge_places_key') || ''
  )

  function setAbstractEmailKey(v) { setAbstractEmailKeyState(v);  localStorage.setItem('forge_abstract_email_key', v) }
  function setAbstractPhoneKey(v) { setAbstractPhoneKeyState(v);  localStorage.setItem('forge_abstract_phone_key', v) }
  function setHunterApiKey(v)     { setHunterApiKeyState(v);      localStorage.setItem('forge_hunter_key', v) }
  function setGooglePlacesKey(v)  { setGooglePlacesKeyState(v);   localStorage.setItem('forge_places_key', v) }

  // ── Forge run state ───────────────────────────────────────────────────────
  const [locationState, setLocationState]       = useState('')
  const [locationCountry, setLocationCountry]   = useState('United States')
  const [blueprintProduct, setBlueprintProduct] = useState(BLUEPRINT_PRODUCTS[0].id)
  const [phase, setPhase]     = useState('idle')
  const [nodes, setNodes]     = useState(NODES_PLACES)
  const [logs, setLogs]       = useState([])
  const [leads, setLeads]     = useState([])
  const [error, setError]     = useState('')
  const [runMeta, setRunMeta] = useState(null)

  // ── Usage tracking ────────────────────────────────────────────────────────
  const [usageToday, setUsageToday]   = useState(() => loadUsage(providerKey))
  const [enrichUsage, setEnrichUsage] = useState(() => loadEnrichUsage())

  // ── Pipeline helpers ──────────────────────────────────────────────────────
  const addLog = useCallback((msg, ok = false) => {
    const now = new Date()
    const ts = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    setLogs(prev => [...prev, { ts, msg, ok, id: Date.now() + Math.random() }])
  }, [])

  const setNode = useCallback((i, status, statusText) => {
    setNodes(prev => prev.map((n, idx) => idx === i ? { ...n, status, statusText } : n))
  }, [])

  // ── Load static SAMPLE data (no real source configured) ───────────────────
  // Replaces the former generative path. No external call, no fabricated PII —
  // these rows are fictional, watermarked, and blocked from CSV export.
  function loadSample() {
    setError('')
    setLogs([])
    setNodes(NODES_PLACES.map(n => ({ ...n, status: 'done', statusText: 'Sample' })))
    addLog('Showing watermarked SAMPLE data (sign in and run a search to fetch real, server-sourced leads).', true)
    setLeads(SAMPLE_LEADS)
    setRunMeta(SAMPLE_RUN_META)
    setPhase('done')
  }

  // ── Tenant API key (auto-provisioned via Supabase, cached in localStorage) ──
  async function getForgeApiKey() {
    const cached = localStorage.getItem(INAPP_KEY_STORAGE)
    if (cached) return cached
    await supabase.rpc('forge_bootstrap_tenant')
    const { data, error: keyErr } = await supabase.rpc('forge_create_api_key', { p_label: 'in-app' })
    if (keyErr) throw new Error(keyErr.message || 'Could not provision API key.')
    const row = Array.isArray(data) ? data[0] : data
    const key = row?.api_key
    if (!key) throw new Error('No API key returned by server.')
    localStorage.setItem(INAPP_KEY_STORAGE, key)
    return key
  }

  async function callLeadsApi(token) {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ state: locationState, country: locationCountry, product: blueprintProduct }),
    })
    const data = await res.json().catch(() => ({}))
    return { res, data }
  }

  // ── Run pipeline (server-held keys) ─────────────────────────────────────────
  async function run() {
    if (!locationState.trim())   { alert('Please enter a state or province.'); return }
    if (!locationCountry.trim()) { alert('Please enter a country.'); return }

    const product = BLUEPRINT_PRODUCTS.find(p => p.id === blueprintProduct)
    const idx = { places: 0, llm: 1, validate: 2, enrich: 3, reach: 4 }

    setPhase('running')
    setLogs([])
    setLeads([])
    setError('')
    setNodes(NODES_PLACES)
    setRunMeta(null)

    try {
      // ── Authorize ─────────────────────────────────────────────────────────
      setNode(idx.places, 'active', 'Authorizing…')
      addLog('Provider keys are held server-side — the browser never sees them.')

      let token
      try {
        token = await getForgeApiKey()
      } catch (e) {
        throw new Error(`Auth / key provisioning failed — ${e.message}. Make sure you're signed in (Forge API keys are issued via Supabase).`)
      }

      // ── Stage 0: Google Places Discovery (server) ─────────────────────────
      setNode(idx.places, 'active', 'Fetching…')
      addLog(`Google Places — server fetching real businesses for ${product.name} in ${locationState}, ${locationCountry}…`)

      let { res, data } = await callLeadsApi(token)

      // Stale/invalid key → reprovision once and retry.
      if (res.status === 401) {
        localStorage.removeItem(INAPP_KEY_STORAGE)
        addLog('Stored API key rejected — reprovisioning and retrying…')
        token = await getForgeApiKey()
        ;({ res, data } = await callLeadsApi(token))
      }

      if (res.status === 429) {
        throw new Error(data.error || 'Rate limit or monthly quota reached. Wait a moment or upgrade your plan in Account.')
      }
      if (res.status >= 500 && /not configured/i.test(data.error || '')) {
        throw new Error(`Server missing env keys: ${data.error} — run via 'netlify dev' linked to forge-automation so the secret env vars load into the function.`)
      }
      // Reachable but returned no JSON (a page, not the function) → wrong port.
      if (res.ok && data.ok === undefined) {
        throw new Error(`No JSON from ${API_ENDPOINT} (got a page). You're likely on the vite port — open the netlify dev URL http://localhost:8888 so functions are served.`)
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.details?.message || `HTTP ${res.status}`)
      }

      const meta = data.meta || {}

      setNode(idx.places, 'done', 'Complete')
      addLog(`${meta.discovered ?? '—'} businesses discovered from Google Places.`, true)
      await wait(160)

      // ── Stage 1: LLM Intelligence (server) ────────────────────────────────
      setNode(idx.llm, 'active', 'Scoring…')
      addLog('Scoring real businesses server-side…')
      await wait(160)
      setNode(idx.llm, 'done', 'Complete')
      addLog(`Leads scored${meta.tokens ? ` · ${meta.tokens} tokens` : ''}.`, true)

      // ── Stage 2: Format Validation (server) ───────────────────────────────
      setNode(idx.validate, 'active', 'Validating…')
      await wait(140)
      setNode(idx.validate, 'done', 'Complete')

      // ── Stage 3: Contact Enrichment (server) ──────────────────────────────
      setNode(idx.enrich, 'active', 'Enriching…')
      await wait(140)
      setNode(idx.enrich, 'done', 'Complete')

      // ── Stage 4: Reachability (server) ────────────────────────────────────
      setNode(idx.reach, 'active', 'Verifying…')
      await wait(140)
      setNode(idx.reach, 'done', 'Complete')

      const mapped = (data.leads || []).map(mapSafeLead)
      addLog(`${meta.qualified ?? mapped.length} hot + reachable lead${(meta.qualified ?? mapped.length) !== 1 ? 's' : ''} qualified (ToS-safe: place_id + Maps link + intelligence).`, true)

      setLeads(mapped)
      setRunMeta({
        locationState, locationCountry, blueprintProduct, productName: product.name,
        dataSource: 'places', isSample: false,
      })
      setPhase('done')
    } catch (err) {
      setError(`Pipeline error: ${err.message}`)
      setPhase('error')
    }
  }

  const [settingsOpen, setSettingsOpen] = useState(false)

  // ── Gate: show auth if no session ───────────────────────────────────────────
  if (authLoading) return null
  if (!session) return <AuthView />

  return (
    <div className="app">
      <TopNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        providerKey={providerKey}
        model={model}
        usageToday={usageToday}
        onOpenSettings={() => setSettingsOpen(true)}
        session={session}
      />

      <main className="main">
        {currentView === 'home' && <Hub setCurrentView={setCurrentView} />}

        {currentView === 'account' && <AccountView session={session} />}

        {currentView === 'forge' && (
          <ForgeView
            locationState={locationState} setLocationState={setLocationState}
            locationCountry={locationCountry} setLocationCountry={setLocationCountry}
            blueprintProduct={blueprintProduct} setBlueprintProduct={setBlueprintProduct}
            phase={phase} nodes={nodes} logs={logs} leads={leads}
            error={error} runMeta={runMeta} run={run}
            providerKey={providerKey} model={model}
          />
        )}

        {currentView === 'workflows' && <WorkflowsView />}
      </main>

      {settingsOpen && (
        <div className="slide-over-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="slide-over" onClick={e => e.stopPropagation()}>
            <SettingsView
              providerKey={providerKey} setProviderKey={setProviderKey}
              model={model} setModel={setModel}
              apiKey={apiKey} setApiKey={setApiKey}
              abstractEmailKey={abstractEmailKey} setAbstractEmailKey={setAbstractEmailKey}
              abstractPhoneKey={abstractPhoneKey} setAbstractPhoneKey={setAbstractPhoneKey}
              hunterApiKey={hunterApiKey} setHunterApiKey={setHunterApiKey}
              googlePlacesKey={googlePlacesKey} setGooglePlacesKey={setGooglePlacesKey}
              enrichUsage={enrichUsage}
              onLogout={handleLogout}
              onClose={() => setSettingsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
