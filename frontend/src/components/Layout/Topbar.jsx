import { useState, useEffect } from 'react'
import { api } from '../../api'
import { Icon } from '../UI'

export default function Topbar({ onNavigate }) {
  const [status, setStatus] = useState({ ok: false, model: '…' })

  useEffect(() => {
    api.health()
      .then(d => setStatus({ ok: true, model: d.groq_model }))
      .catch(() => setStatus({ ok: false, model: 'offline' }))
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-logo">
        <div className="logo-icon"><Icon name="logo" size={18} /></div>
        <div className="logo-text">Lattice<span>Forge</span></div>
      </div>

      <div className="topbar-status">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="status-dot" style={{ background: status.ok ? 'var(--green)' : 'var(--red)', boxShadow: `0 0 8px ${status.ok ? 'var(--green)' : 'var(--red)'}` }} />
          <span>{status.ok ? 'API Online' : 'API Offline'}</span>
        </div>
        <span>|</span>
        <span>Groq: <strong style={{ color: 'var(--accent3)' }}>{status.model}</strong></span>
      </div>

      <div className="topbar-actions">
        <button className="btn btn-outline btn-sm" onClick={() => window.location.reload()}><Icon name="refresh" size={14} /> Refresh</button>
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('router')}><Icon name="play" size={14} /> Run Task</button>
      </div>
    </header>
  )
}
