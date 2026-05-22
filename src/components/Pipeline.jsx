import { useEffect, useRef } from 'react'

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

function IconCpu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9"  y1="1"  x2="9"  y2="4"/>
      <line x1="15" y1="1"  x2="15" y2="4"/>
      <line x1="9"  y1="20" x2="9"  y2="23"/>
      <line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9"  x2="23" y2="9"/>
      <line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1"  y1="9"  x2="4"  y2="9"/>
      <line x1="1"  y1="14" x2="4"  y2="14"/>
    </svg>
  )
}

const ICON_MAP = { search: IconSearch, globe: IconGlobe, cpu: IconCpu }

export default function Pipeline({ nodes, logs, visible, progressPct = 0 }) {
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  if (!visible && logs.length === 0) return null

  return (
    <div className="pipeline" style={{ display: visible ? 'block' : 'none' }}>
      <div className="pipeline-lbl">
        <span className="pipeline-lbl-dot" />
        Pipeline Status
      </div>

      <div className="pipeline-progress">
        <div className="pipeline-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="p-nodes">
        {nodes.map(node => {
          const Icon = ICON_MAP[node.iconId] || IconSearch
          return (
            <div key={node.label} className={`p-node ${node.status}`}>
              <div className="p-node-inner">
                <div className="p-icon">
                  <Icon />
                </div>
                <div className="p-name">{node.label}</div>
                <div className="p-status">{node.statusText}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-log" ref={logRef}>
        {logs.map(entry => (
          <span key={entry.id} className={`log-line${entry.ok ? ' ok' : ''}`}>
            <span className="log-ts">{entry.ts}</span>
            {entry.msg}
            {'\n'}
          </span>
        ))}
      </div>
    </div>
  )
}
