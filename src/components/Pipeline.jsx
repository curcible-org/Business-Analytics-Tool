import { useEffect, useRef } from 'react'

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

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M9 21V9"/>
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

const ICON_MAP = {
  cpu:      IconCpu,
  check:    IconCheck,
  building: IconBuilding,
  mail:     IconMail,
  shield:   IconShield,
}

export default function Pipeline({ nodes, logs, visible, progressPct = 0 }) {
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
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
          const Icon = ICON_MAP[node.iconId] || IconCpu
          return (
            <div key={node.label} className={`p-node ${node.status}`}>
              <div className="p-node-inner">
                <div className="p-icon"><Icon /></div>
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
