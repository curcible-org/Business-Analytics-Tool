import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Hub from './views/Hub.jsx'
import ForgeView from './views/ForgeView.jsx'
import { PROVIDERS } from './config/providers.js'
import { BLUEPRINT_PRODUCTS } from './config/products.js'
import { callLLM } from './utils/llm.js'
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
  localStorage.setItem('forge_usage', JSON.stringify({
    date: TODAY(),
    provider: providerKey,
    ...usage,
  }))
}

const INIT_NODES = [
  { label: 'LLM Discovery',      iconId: 'cpu',      status: 'idle', statusText: 'Waiting…' },
  { label: 'Format Validation',  iconId: 'check',    status: 'idle', statusText: 'Waiting…' },
  { label: 'Identity Check',     iconId: 'building', status: 'idle', statusText: 'Waiting…' },
  { label: 'Contact Enrichment', iconId: 'mail',     status: 'idle', statusText: 'Waiting…' },
  { label: 'Reachability',       iconId: 'shield',   status: 'idle', statusText: 'Waiting…' },
]

export default function App() {
  const [currentView, setCurrentView] = useState('home')

  // LLM provider state
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

  // Enrichment keys — persisted in localStorage
  const [abstractEmailKey, setAbstractEmailKeyState] = useState(
    () => localStorage.getItem('forge_abstract_email_key') || ''
  )
  const [abstractPhoneKey, setAbstractPhoneKeyState] = useState(
    () => localStorage.getItem('forge_abstract_phone_key') || ''
  )
  const [hunterApiKey, setHunterApiKeyState] = useState(
    () => localStorage.getItem('forge_hunter_key') || ''
  )

  // Forge run state
  const [locationState, setLocationState]     = useState('')
  const [locationCountry, setLocationCountry] = useState('United States')
  const [blueprintProduct, setBlueprintProduct] = useState(BLUEPRINT_PRODUCTS[0].id)
  const [phase, setPhase]   = useState('idle')
  const [nodes, setNodes]   = useState(INIT_NODES)
  const [logs, setLogs]     = useState([])
  const [leads, setLeads]   = useState([])
  const [error, setError]   = useState('')
  const [runMeta, setRunMeta] = useState(null)

  // Usage tracking
  const [usageToday, setUsageToday] = useState(() => loadUsage(providerKey))
  const [enrichUsage, setEnrichUsage] = useState(() => loadEnrichUsage())


  function setAbstractEmailKey(v) { setAbstractEmailKeyState(v); localStorage.setItem('forge_abstract_email_key', v) }
  function setAbstractPhoneKey(v) { setAbstractPhoneKeyState(v); localStorage.setItem('forge_abstract_phone_key', v) }
  function setHunterApiKey(v)     { setHunterApiKeyState(v);     localStorage.setItem('forge_hunter_key', v) }

  const addLog = useCallback((msg, ok = false) => {
    const now = new Date()
    const ts = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    setLogs(prev => [...prev, { ts, msg, ok, id: Date.now() + Math.random() }])
  }, [])

  const setNode = useCallback((i, status, statusText) => {
    setNodes(prev => prev.map((n, idx) => idx === i ? { ...n, status, statusText } : n))
  }, [])

  async function run() {
    if (!locationState.trim())   { alert('Please enter a state or province.'); return }
    if (!locationCountry.trim()) { alert('Please enter a country.'); return }
    if (!apiKey.trim())          { alert('Please enter your LLM API key in the sidebar.'); return }

    const product = BLUEPRINT_PRODUCTS.find(p => p.id === blueprintProduct)

    setPhase('running')
    setLogs([])
    setLeads([])
    setError('')
    setNodes(INIT_NODES)
    setRunMeta(null)

    // Snapshot enrichment budgets at run start (monthly remaining)
    const currentEnrichUsage = loadEnrichUsage()
    const hunterBudget       = remaining(currentEnrichUsage, 'hunter')
    const emailBudget        = remaining(currentEnrichUsage, 'abstract_email')
    const phoneBudget        = remaining(currentEnrichUsage, 'abstract_phone')

    try {
      // ── Stage 0: LLM Discovery ──────────────────────────────────────────
      setNode(0, 'active', 'Running…')
      addLog(`Routing to ${PROVIDERS[providerKey].label} (${model})…`)
      addLog(`Discovering leads for ${product.name} in ${locationState}, ${locationCountry}…`)

      const { leads: raw, usage } = await callLLM({
        providerKey, model,
        state: locationState,
        country: locationCountry,
        targetProduct: blueprintProduct,
        apiKey,
      })

      const newUsage = {
        requests:    (usageToday.requests    || 0) + 1,
        totalTokens: (usageToday.totalTokens || 0) + (usage.totalTokens || 0),
      }
      saveUsage(providerKey, newUsage)
      setUsageToday(newUsage)

      setNode(0, 'done', 'Complete')
      addLog(`${raw.length} leads discovered.`, true)
      await wait(200)

      // ── Stage 1: Format Validation ──────────────────────────────────────
      setNode(1, 'active', 'Validating…')
      addLog(`Phone, email, URL format validation…`)

      const validated = runFormatValidation(raw)
      const validPhones = validated.filter(l => l.phone_valid).length
      const validEmails = validated.filter(l => l.email_format_valid).length
      const validUrls   = validated.filter(l => l.url_format_valid).length

      setNode(1, 'done', 'Complete')
      addLog(`Phones: ${validPhones}/${validated.filter(l => l.phone).length} valid  ·  Emails: ${validEmails}/${validated.filter(l => l.email).length} valid  ·  URLs: ${validUrls}/${validated.filter(l => l.website).length} valid`, true)
      await wait(200)

      // ── Stage 2: Identity Check (Clearbit) ─────────────────────────────
      setNode(2, 'active', 'Checking…')
      addLog(`Clearbit — company name → domain cross-check (free, no quota)…`)

      const enrichedClearbit = await enrichWithClearbit(validated)
      const cbMatch    = enrichedClearbit.filter(l => l.clearbit_match === 'match').length
      const cbMismatch = enrichedClearbit.filter(l => l.clearbit_match === 'mismatch').length
      const cbMissing  = enrichedClearbit.filter(l => l.clearbit_match === 'not_found').length

      setNode(2, 'done', 'Complete')
      addLog(`Clearbit: ${cbMatch} confirmed · ${cbMismatch} mismatch · ${cbMissing} not found`, true)
      await wait(200)

      // ── Stage 3: Contact Enrichment ─────────────────────────────────────
      setNode(3, 'active', 'Enriching…')
      let enriched = enrichedClearbit
      let hunterUsedNow = 0
      let emailUsedNow  = 0
      let phoneUsedNow  = 0

      // Hunter.io — email discovery
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
        addLog(`Hunter.io — skipped (no key)`)
      }

      // AbstractAPI — email SMTP + phone carrier
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
        addLog(`AbstractAPI — skipped (no keys)`)
      }

      // Persist enrichment usage
      const newEnrichUsage = {
        ...currentEnrichUsage,
        hunter:         currentEnrichUsage.hunter         + hunterUsedNow,
        abstract_email: currentEnrichUsage.abstract_email + emailUsedNow,
        abstract_phone: currentEnrichUsage.abstract_phone + phoneUsedNow,
      }
      saveEnrichUsage(newEnrichUsage)
      setEnrichUsage(newEnrichUsage)

      enriched = applyConfidence(enriched)
      setNode(3, 'done', 'Complete')
      await wait(200)

      // ── Stage 4: Reachability ───────────────────────────────────────────
      setNode(4, 'active', 'Verifying…')
      const withWebsite = enriched.filter(l => l.website && l.url_format_valid).length
      addLog(`Checking reachability for ${withWebsite} valid website${withWebsite !== 1 ? 's' : ''}…`)
      addLog(`Generating Google Maps links…`)

      const verified = await verifyReachability(enriched)
      const live      = verified.filter(l => l.web_verified === true).length
      const dead      = verified.filter(l => l.web_verified === false).length
      const noWebsite = verified.filter(l => l.web_verified === null).length

      setNode(4, 'done', 'Complete')
      addLog(`Reachability: ${live} live · ${dead} unreachable · ${noWebsite} no website`, true)

      // Keep only hot leads with a live, reachable website
      const qualified = verified.filter(l => l.score === 'hot' && l.web_verified === true)
      const dropped   = verified.length - qualified.length
      addLog(`Filtered: ${qualified.length} hot + live leads retained · ${dropped} dropped`, true)

      setLeads(qualified)
      setRunMeta({ locationState, locationCountry, blueprintProduct, productName: product.name })
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
        setProviderKey={key => {
          setProviderKey(key)
          setUsageToday(loadUsage(key))
          localStorage.setItem('forge_provider', key)
        }}
        model={model}
        setModel={setModel}
        apiKey={apiKey}
        setApiKey={v => { setApiKey(v); localStorage.setItem('forge_key', v) }}
        abstractEmailKey={abstractEmailKey}
        setAbstractEmailKey={setAbstractEmailKey}
        abstractPhoneKey={abstractPhoneKey}
        setAbstractPhoneKey={setAbstractPhoneKey}
        hunterApiKey={hunterApiKey}
        setHunterApiKey={setHunterApiKey}
        usageToday={usageToday}
        enrichUsage={enrichUsage}
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
      </main>
    </div>
  )
}
