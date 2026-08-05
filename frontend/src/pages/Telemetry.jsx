import { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'
import { api } from '../api'
import { Card, StatCard, Spinner } from '../components/UI'
import { useToast } from '../context/ToastContext'

export default function Telemetry() {
  const toast = useToast()
  const [summary, setSummary] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [s, e] = await Promise.all([api.getTelemetry(), api.getEntries(50)])
      setSummary(s)
      setEntries(e.entries ?? [])
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const plotLayout = (title) => ({
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    font:   { family: 'Inter, sans-serif', color: '#94a3b8', size: 11 },
    margin: { l: 40, r: 10, t: 30, b: 40 },
    title:  { text: title, font: { size: 12, color: '#94a3b8' } },
    xaxis:  { color: '#475569', gridcolor: 'rgba(99,102,241,0.1)', showgrid: true },
    yaxis:  { color: '#475569', gridcolor: 'rgba(99,102,241,0.1)', showgrid: true },
  })

  const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  const times   = sortedEntries.map((_, i) => i + 1)
  const quals   = sortedEntries.map(e => e.measured_quality)
  const lats    = sortedEntries.map(e => e.actual_latency_ms)
  const costs   = sortedEntries.map(e => e.billed_cost)

  const mkTrace = (y, name, color) => ({
    x: times, y,
    type: 'scatter', mode: 'lines+markers', name,
    line: { color, width: 2 },
    marker: { color, size: 5 },
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Telemetry Dashboard</h1>
          <p>Real-time execution metrics logged to SQLite. Powers Pareto front recomputation.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>⟳ Refresh</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Executions" value={summary?.total_executions ?? 0} />
        <StatCard label="Avg Quality"  value={summary?.avg_quality?.toFixed(3) ?? '–'} />
        <StatCard label="Avg Latency"  value={summary?.avg_latency_ms ? `${summary.avg_latency_ms.toFixed(0)}ms` : '–'} />
        <StatCard label="Avg Cost"     value={summary?.avg_cost ? `$${summary.avg_cost.toFixed(4)}` : '–'} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spinner /></div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <p>No executions yet. Route a task to populate telemetry.</p>
        </div>
      ) : (
        <>
          <div className="grid-2" style={{ marginBottom: 18 }}>
            <Card title="Quality over Time" icon="📊">
              <Plot
                data={[mkTrace(quals, 'Quality', '#10b981')]}
                layout={{ ...plotLayout(''), yaxis: { ...plotLayout('').yaxis, range: [0, 1] } }}
                style={{ width: '100%', height: 260 }}
                config={{ displayModeBar: false, responsive: true }}
              />
            </Card>
            <Card title="Latency over Time" icon="⏱">
              <Plot
                data={[mkTrace(lats, 'Latency (ms)', '#f59e0b')]}
                layout={plotLayout('')}
                style={{ width: '100%', height: 260 }}
                config={{ displayModeBar: false, responsive: true }}
              />
            </Card>
          </div>

          <Card title="Recent Executions" icon="📋">
            <div style={{ overflowX: 'auto' }}>
              <table className="telem-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Task</th>
                    <th>Concept</th>
                    <th>Config</th>
                    <th>Quality</th>
                    <th>Latency</th>
                    <th>Cost</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {[...entries].reverse().map((e, i) => (
                    <tr key={e.execution_id}>
                      <td style={{ color: 'var(--text-muted)' }}>{entries.length - i}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}
                          title={e.task_description}>{e.task_description}</td>
                      <td><span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{e.concept_id}</span></td>
                      <td><span style={{ color: 'var(--accent3)', fontSize: 10 }}>{e.config_id}</span></td>
                      <td><span className="glow-green">{e.measured_quality?.toFixed(3)}</span></td>
                      <td><span className="glow-yellow">{e.actual_latency_ms?.toFixed(0)}ms</span></td>
                      <td><span className="glow-cyan">${e.billed_cost?.toFixed(4)}</span></td>
                      <td style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {new Date(e.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
