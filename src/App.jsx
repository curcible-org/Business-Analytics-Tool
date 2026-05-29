import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Hub from './views/Hub.jsx'
import ForgeView from './views/ForgeView.jsx'
import SettingsView from './views/SettingsView.jsx'
import LoginView from './views/LoginView.jsx'
import { PROVIDERS } from './config/providers.js'
import { BLUEPRINT_PRODUCTS } from './config/products.js'
import { callLLM, scorePlacesLeads } from './utils/llm.js'
import { searchPlaces } from './utils/places.js'
import { runFormatValidation } from './utils/validate.js'
import { enrichWithClearbit, enrichWithHunter, enrichWithAbstractAPI, applyConfidence } from './utils/enrich.js'
import { verifyReachability } from './utils/verify.js'
import { loadEnrichUsage, saveEnrichUsage, remaining } from './utils/enrichUsage.js'

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

// Nodes differ based on data source: Places (6 stages) vs LLM-only (5 stages)
const NODES_LLM = [
  { label: 'LLM Discovery',      iconId: 'cpu',      status: 'idle', statusText: 'Waiting…' },
  { label: 'Format Validation',  iconId: 'check',    status: 'idle', statusText: 'Waiting…' },
  { label: 'Identity Check',     iconId: 'building', status: 'idle', statusText: 'Waiting…' },
  { label: 'Contact Enrichment', iconId: 'mail',     status: 'idle', statusText: 'Waiting…' },
  { label: 'Reachability',       iconId: 'shield',   status: 'idle', statusText: 'Waiting…' },
]

const NODES_PLACES = [
  { label: 'Places Discovery',   iconId: 'map-pin',  status: 'idle', statusText: 'Waiting…' },
  { label: 'LLM Intelligence',   iconId: 'cpu',      status: 'idle', statusText: 'Waiting…' },
  { label: 'Format Validation',  iconId: 'check',    status: 'idle', statusText: 'Waiting…' },
  { label: 'Identity Check',     iconId: 'building', status: 'idle', statusText: 'Waiting…' },
  { label: 'Contact Enrichment', iconId: 'mail',     status: 'idle', statusText: 'Waiting…' },
  { label: 'Reachability',       iconId: 'shield',   status: 'idle', statusText: 'Waiting…' },
]

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('forge_session'))

  function handleLogin() {
    localStorage.setItem('forge_session', '1')
    setAuthed(true)
  }

  function handleLogout() {
    localStorage.removeItem('forge_session')
    setAuthed(false)
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
  const [nodes, setNodes]     = useState(NODES_LLM)
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

  // ── Run pipeline ──────────────────────────────────────────────────────────
  async function run() {
    if (!locationState.trim())   { alert('Please enter a state or province.'); return }
    if (!locationCountry.trim()) { alert('Please enter a country.'); return }
    if (!apiKey.trim())          { alert('Please enter your LLM API key in Settings.'); return }

    const product        = BLUEPRINT_PRODUCTS.find(p => p.id === blueprintProduct)
    const hasPlaces      = !!googlePlacesKey.trim()
    const INIT_NODES     = hasPlaces ? NODES_PLACES : NODES_LLM
    const currentEnrichUsage = loadEnrichUsage()
    const hunterBudget   = remaining(currentEnrichUsage, 'hunter')
    const emailBudget    = remaining(currentEnrichUsage, 'abstract_email')
    const phoneBudget    = remaining(currentEnrichUsage, 'abstract_phone')

    // Stage index map (shifts by 1 in Places mode)
    const idx = hasPlaces
      ? { places: 0, llm: 1, validate: 2, clearbit: 3, enrich: 4, reach: 5 }
      : {           llm: 0, validate: 1, clearbit: 2, enrich: 3, reach: 4 }

    setPhase('running')
    setLogs([])
    setLeads([])
    setError('')
    setNodes(INIT_NODES)
    setRunMeta(null)

    try {
      let raw    // raw leads before LLM scoring
      let usage = { totalTokens: 0 }

      // ── Stage 0 (Places mode only): Google Places Discovery ───────────────
      if (hasPlaces) {
        setNode(idx.places, 'active', 'Fetching…')
        addLog(`Google Places — fetching real businesses for ${product.name} in ${locationState}, ${locationCountry}…`)

        const placesLeads = await searchPlaces({
          state: locationState, country: locationCountry,
          targetProduct: blueprintProduct, apiKey: googlePlacesKey,
        })

        setNode(idx.places, 'done', 'Complete')
        addLog(`${placesLeads.length} real businesses fetched from Google Places.`, true)
        await wait(200)

        // ── Stage 1 (Places mode): LLM Intelligence — score real businesses ─
        setNode(idx.llm, 'active', 'Scoring…')
        addLog(`Routing to ${PROVIDERS[providerKey].label} (${model})…`)
        addLog(`Analyzing and scoring ${placesLeads.length} real businesses for ${product.name}…`)

        const scored = await scorePlacesLeads({
          leads: placesLeads, providerKey, model,
          targetProduct: blueprintProduct, apiKey,
        })
        raw   = scored.leads
        usage = scored.usage
      } else {
        // ── Stage 0 (LLM-only mode): LLM Discovery ───────────────────────────
        setNode(idx.llm, 'active', 'Running…')
        addLog(`Routing to ${PROVIDERS[providerKey].label} (${model})…`)
        addLog(`Discovering leads for ${product.name} in ${locationState}, ${locationCountry}…`)

        const result = await callLLM({
          providerKey, model, state: locationState, country: locationCountry,
          targetProduct: blueprintProduct, apiKey,
        })
        raw   = result.leads
        usage = result.usage
      }

      // Track LLM usage
      const newUsage = {
        requests:    (usageToday.requests    || 0) + 1,
        totalTokens: (usageToday.totalTokens || 0) + (usage.totalTokens || 0),
      }
      saveUsage(providerKey, newUsage)
      setUsageToday(newUsage)

      setNode(idx.llm, 'done', 'Complete')
      addLog(`${raw.length} leads ${hasPlaces ? 'scored' : 'discovered'}.`, true)
      await wait(200)

      // ── Format Validation ─────────────────────────────────────────────────
      setNode(idx.validate, 'active', 'Validating…')
      addLog(`Phone, email, URL format validation…`)
      const validated   = runFormatValidation(raw)
      const validPhones = validated.filter(l => l.phone_valid).length
      const validEmails = validated.filter(l => l.email_format_valid).length
      const validUrls   = validated.filter(l => l.url_format_valid).length
      setNode(idx.validate, 'done', 'Complete')
      addLog(`Phones: ${validPhones}/${validated.filter(l => l.phone).length} valid  ·  Emails: ${validEmails}/${validated.filter(l => l.email).length} valid  ·  URLs: ${validUrls}/${validated.filter(l => l.website).length} valid`, true)
      await wait(200)

      // ── Identity Check (Clearbit) ─────────────────────────────────────────
      setNode(idx.clearbit, 'active', 'Checking…')
      addLog(`Clearbit — company name → domain cross-check (free, no quota)…`)
      const afterClearbit = await enrichWithClearbit(validated)
      const cbMatch    = afterClearbit.filter(l => l.clearbit_match === 'match').length
      const cbMismatch = afterClearbit.filter(l => l.clearbit_match === 'mismatch').length
      const cbMissing  = afterClearbit.filter(l => l.clearbit_match === 'not_found').length
      setNode(idx.clearbit, 'done', 'Complete')
      addLog(`Clearbit: ${cbMatch} confirmed · ${cbMismatch} mismatch · ${cbMissing} not found`, true)
      await wait(200)

      // ── Contact Enrichment ────────────────────────────────────────────────
      setNode(idx.enrich, 'active', 'Enriching…')
      let enriched = afterClearbit
      let hunterUsedNow = 0, emailUsedNow = 0, phoneUsedNow = 0

      if (hunterApiKey.trim()) {
        if (hunterBudget > 0) {
          addLog(`Hunter.io — email discovery (${hunterBudget} calls remaining this month)…`)
          const r = await enrichWithHunter(enriched, hunterApiKey, hunterBudget)
          enriched      = r.leads
          hunterUsedNow = r.used
          const found = enriched.filter(l => l.email_source === 'hunter').length
          addLog(`Hunter: ${found} email${found !== 1 ? 's' : ''} discovered · ${hunterUsedNow} call${hunterUsedNow !== 1 ? 's' : ''} used`)
        } else {
          addLog(`Hunter.io — monthly quota exhausted (25/25 used)`)
        }
      } else {
        addLog(`Hunter.io — skipped (add key in Settings)`)
      }

      const hasAbstractEmail = !!abstractEmailKey.trim()
      const hasAbstractPhone = !!abstractPhoneKey.trim()
      if (hasAbstractEmail || hasAbstractPhone) {
        const emailNote = hasAbstractEmail ? `email ${emailBudget}/100 remaining` : 'email key missing'
        const phoneNote = hasAbstractPhone ? `phone ${phoneBudget}/100 remaining` : 'phone key missing'
        addLog(`AbstractAPI — ${emailNote} · ${phoneNote}…`)
        const r = await enrichWithAbstractAPI(enriched, abstractEmailKey, abstractPhoneKey, emailBudget, phoneBudget)
        enriched     = r.leads
        emailUsedNow = r.emailUsed
        phoneUsedNow = r.phoneUsed
        const smtp = enriched.filter(l => l.email_deliverable === true).length
        addLog(`AbstractAPI: ${emailUsedNow} email call${emailUsedNow !== 1 ? 's' : ''} · ${phoneUsedNow} phone call${phoneUsedNow !== 1 ? 's' : ''} · ${smtp} SMTP confirmed`)
      } else {
        addLog(`AbstractAPI — skipped (add keys in Settings)`)
      }

      const newEnrichUsage = {
        ...currentEnrichUsage,
        hunter:         currentEnrichUsage.hunter         + hunterUsedNow,
        abstract_email: currentEnrichUsage.abstract_email + emailUsedNow,
        abstract_phone: currentEnrichUsage.abstract_phone + phoneUsedNow,
      }
      saveEnrichUsage(newEnrichUsage)
      setEnrichUsage(newEnrichUsage)

      enriched = applyConfidence(enriched)
      setNode(idx.enrich, 'done', 'Complete')
      await wait(200)

      // ── Reachability ──────────────────────────────────────────────────────
      setNode(idx.reach, 'active', 'Verifying…')
      const withWebsite = enriched.filter(l => l.website && l.url_format_valid).length
      addLog(`Checking reachability for ${withWebsite} valid website${withWebsite !== 1 ? 's' : ''}…`)
      addLog(`Generating Google Maps links…`)
      const verified  = await verifyReachability(enriched)
      const live      = verified.filter(l => l.web_verified === true).length
      const dead      = verified.filter(l => l.web_verified === false).length
      const noWebsite = verified.filter(l => l.web_verified === null).length
      setNode(idx.reach, 'done', 'Complete')
      addLog(`Reachability: ${live} live · ${dead} unreachable · ${noWebsite} no website`, true)

      // Final filter: hot score + live website
      const qualified = verified.filter(l => l.score === 'hot' && l.web_verified === true)
      const dropped   = verified.length - qualified.length
      addLog(`Filtered: ${qualified.length} hot + live leads retained · ${dropped} dropped`, true)

      setLeads(qualified)
      setRunMeta({
        locationState, locationCountry, blueprintProduct, productName: product.name,
        dataSource: hasPlaces ? 'places' : 'llm',
      })
      setPhase('done')
    } catch (err) {
      setError(`Pipeline error: ${err.message}`)
      setPhase('error')
    }
  }

  // ── Gate: show login if not authenticated ─────────────────────────────────
  if (!authed) return <LoginView onLogin={handleLogin} />

  return (
    <div className="app">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        providerKey={providerKey}
        model={model}
        usageToday={usageToday}
        enrichUsage={enrichUsage}
        hasPlacesKey={!!googlePlacesKey.trim()}
      />

      <main className="main">
        {currentView === 'home' && <Hub setCurrentView={setCurrentView} />}

        {currentView === 'forge' && (
          <ForgeView
            locationState={locationState} setLocationState={setLocationState}
            locationCountry={locationCountry} setLocationCountry={setLocationCountry}
            blueprintProduct={blueprintProduct} setBlueprintProduct={setBlueprintProduct}
            phase={phase} nodes={nodes} logs={logs} leads={leads}
            error={error} runMeta={runMeta} run={run}
          />
        )}

        {currentView === 'plan' && (
          <iframe src="/plan.html" className="plan-frame" title="Curcible Sequential Plan" />
        )}

        {currentView === 'settings' && (
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
          />
        )}
      </main>
    </div>
  )
}
