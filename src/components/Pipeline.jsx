import { useEffect, useRef } from 'react'

export default function Pipeline({ nodes, logs, visible }) {
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  if (!visible && logs.length === 0) return null

  return (
    <div className="pipeline" style={{ display: visible ? 'block' : 'none' }}>
      <div className="pipeline-lbl">Pipeline Status</div>

      <div className="p-nodes">
        {nodes.map((node, i) => (
          <div key={node.label} className={`p-node ${node.status}`}>
            <div className="p-node-inner">
              <div className="p-icon">{node.icon}</div>
              <div className="p-name">{node.label}</div>
              <div className="p-status">{node.statusText}</div>
            </div>
          </div>
        ))}
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
