import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { Card, Spinner, Icon } from '../components/UI'
import { useToast } from '../context/ToastContext'

export default function FormalContext() {
  const toast = useToast()
  const [ctx, setCtx]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(null) // "task|attr"

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCtx(await api.getContext())
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  async function toggleCell(task, attr, current) {
    const key = `${task}|${attr}`
    setSaving(key)
    try {
      await api.updateCell(task, attr, current === 1 ? 0 : 1)
      await load()
      toast('Cell updated', 'success')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="page"><Spinner /></div>
  if (!ctx)    return <div className="page"><p className="info-text">Failed to load context.</p></div>

  const { tasks, attributes, attribute_labels, incidence } = ctx
  const totalCells = tasks.length * attributes.length
  const onCells    = tasks.reduce((s, t) => s + incidence[t].reduce((a, v) => a + v, 0), 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Formal Context Matrix</h1>
          <p>Binary incidence matrix K = (G, M, I). Click any cell to toggle the relation.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}><Icon name="refresh" size={14} /> Reload</button>
      </div>

      <div className="grid-3" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-label">Tasks (Objects)</div>
          <div className="stat-value">{tasks.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Attributes</div>
          <div className="stat-value">{attributes.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Density</div>
          <div className="stat-value">{((onCells / totalCells) * 100).toFixed(1)}%</div>
          <div className="stat-sub">{onCells}/{totalCells} cells active</div>
        </div>
      </div>

      <Card title="K = (G, M, I) — Tasks × Attributes" icon="table">
        <div className="matrix-wrapper">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="task-header">Task \ Attribute</th>
                {attributes.map(a => (
                  <th key={a}>{attribute_labels[a] ?? a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task}>
                  <td className="task-name-cell">{task}</td>
                  {attributes.map((attr, i) => {
                    const val = incidence[task]?.[i] ?? 0
                    const key = `${task}|${attr}`
                    return (
                      <td key={attr}>
                        <div
                          className={`matrix-cell ${val ? 'on' : 'off'}`}
                          onClick={() => toggleCell(task, attr, val)}
                          title={`${task} × ${attribute_labels[attr] ?? attr}`}
                        >
                          {saving === key ? <Spinner /> : val ? '✓' : ''}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
