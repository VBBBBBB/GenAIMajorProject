import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Spinner } from '../components/UI'
import ParetoChart from '../components/Charts/ParetoChart'
import { useToast } from '../context/ToastContext'

const POOLS = [
  { value: 'default',       label: 'Default Pool' },
  { value: 'code_heavy',    label: 'Code-Heavy Pool' },
  { value: 'data_analysis', label: 'Data Analysis Pool' },
]

export default function ParetoFrontier() {
  const toast = useToast()
  const [pool, setPool]         = useState('default')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [weights, setWeights]   = useState({ q: 0.40, l: 0.30, c: 0.30 })
  const [selected, setSelected] = useState(null)

  async function load(p) {
    setLoading(true)
    setSelected(null)
    try {
      setData(await api.getPoolConfigs(p))
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(pool) }, [])

  function handlePoolChange(e) {
    setPool(e.target.value)
    load(e.target.value)
  }

  async function selectConfig() {
    if (!data) return
    const fakeConceptId = 'C' + pool.toUpperCase().slice(0, 6).padEnd(8, '0')
    try {
      const r = await api.selectConfig(fakeConceptId, weights.q, weights.l, weights.c)
      setSelected(r.selected)
    } catch {
      // fallback: compute locally
      const front = data.configurations?.filter(c => data.pareto_front_ids?.includes(c.id)) ?? []
      if (front.length > 0) setSelected(front[0])
    }
  }

  function updateWeight(key, val) {
    setWeights(w => ({ ...w, [key]: parseFloat(val) }))
    setSelected(null)
  }

  const configs = data?.configurations ?? []
  const paretoIds = data?.pareto_front_ids ?? []

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Pareto Frontier</h1>
          <p>Multi-objective trade-off surface: Quality vs Latency vs Cost per formal concept.</p>
        </div>
      </div>

      <Card title="3D Pareto Surface" icon="📈" style={{ marginBottom: 18 }}
        extra={
          <select value={pool} onChange={handlePoolChange} style={{ width: 200 }}>
            {POOLS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        }
      >
        {loading
          ? <div style={{ textAlign: 'center', padding: 48 }}><Spinner /></div>
          : <ParetoChart configs={configs} paretoFrontIds={paretoIds} />
        }
      </Card>

      <Card title="Configurations" icon="⚙️">
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <span className="tag tag-green">🟢 Pareto Optimal ({paretoIds.length})</span>
          <span className="tag tag-muted">Dominated ({configs.length - paretoIds.length})</span>
        </div>

        <div className="config-cards">
          {configs.map(c => (
            <div key={c.id} className={`config-card ${paretoIds.includes(c.id) ? 'pareto' : 'dominated'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="config-name">{c.name}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {paretoIds.includes(c.id) && <span className="tag tag-green">Pareto ✦</span>}
                  <span className="tag tag-accent" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{c.model}</span>
                </div>
              </div>
              <div className="metrics-row">
                <div className="metric"><div className="metric-label">Quality</div><div className="metric-value quality-val">{c.quality.toFixed(2)}</div></div>
                <div className="metric"><div className="metric-label">Latency</div><div className="metric-value latency-val">{c.latency_ms}ms</div></div>
                <div className="metric"><div className="metric-label">Cost</div><div className="metric-value cost-val">${c.cost_per_query}</div></div>
                <div className="metric"><div className="metric-label">Prompt</div><div className="metric-value" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.prompt_style}</div></div>
              </div>
            </div>
          ))}
        </div>

        <hr className="hr-divider" />

        <div className="card-title" style={{ marginBottom: 14 }}>
          <span>🎯</span> Interactive Selector
        </div>
        <div className="weight-controls">
          {[
            { key: 'q', label: 'Quality Weight', color: 'var(--green)' },
            { key: 'l', label: 'Latency Weight', color: 'var(--yellow)' },
            { key: 'c', label: 'Cost Weight',    color: 'var(--accent2)' },
          ].map(({ key, label, color }) => (
            <div key={key} className="weight-item">
              <div className="weight-label">
                <span style={{ color }}>{label}</span>
                <span className="weight-val">{weights[key].toFixed(2)}</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={weights[key]}
                onChange={e => updateWeight(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={selectConfig}>
          🎯 Select Best Config
        </button>

        {selected && (
          <div className="result-box" style={{ marginTop: 14 }}>
            <div style={{ color: 'var(--green)', fontWeight: 700, marginBottom: 8 }}>✦ Selected: {selected.name}</div>
            <div className="metrics-row">
              <div className="metric"><div className="metric-label">Quality</div><div className="metric-value quality-val">{selected.quality}</div></div>
              <div className="metric"><div className="metric-label">Latency</div><div className="metric-value latency-val">{selected.latency_ms}ms</div></div>
              <div className="metric"><div className="metric-label">Cost</div><div className="metric-value cost-val">${selected.cost_per_query}</div></div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
