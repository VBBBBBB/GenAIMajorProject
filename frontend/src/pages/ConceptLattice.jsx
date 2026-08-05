import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, StatCard, Spinner, EmptyState } from '../components/UI'
import LatticeCanvas from '../components/Charts/LatticeCanvas'
import { useToast } from '../context/ToastContext'

export default function ConceptLattice() {
  const toast = useToast()
  const [lattice, setLattice]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    try {
      setLattice(await api.getLattice())
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Concept Lattice</h1>
          <p>Hasse diagram of all formal concepts. Hover nodes for extent/intent. Nodes ordered by specialisation.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>⟳ Recompute</button>
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <StatCard label="Formal Concepts" value={lattice?.stats?.num_concepts} sub="maximal rectangles in context" />
        <StatCard label="Hasse Edges"     value={lattice?.stats?.num_edges}    sub="cover relations" />
      </div>

      <Card title="Hasse Diagram" icon="⬡" style={{ marginBottom: 18 }}
        extra={<span className="info-text">Hover a node to inspect extent/intent</span>}
      >
        {loading
          ? <div style={{ textAlign: 'center', padding: 48 }}><Spinner /></div>
          : <LatticeCanvas lattice={lattice} />
        }
      </Card>

      <Card title="All Concepts" icon="📋">
        {loading ? <Spinner /> : (
          <div className="concept-grid">
            {lattice?.concepts?.map(c => (
              <div
                key={c.id}
                className={`concept-card ${selected?.id === c.id ? 'selected' : ''}`}
                onClick={() => setSelected(c)}
              >
                <div className="concept-id">{c.id}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Level {c.level}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Extent ({c.extent.length}):</strong>{' '}
                  {c.extent.slice(0, 3).join(', ')}{c.extent.length > 3 ? '…' : ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Intent ({c.intent.length}):</strong>{' '}
                  {c.intent.length > 0 ? c.intent.join(', ') : '∅'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail panel for selected concept */}
        {selected && (
          <div className="result-box" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 14, fontWeight: 700 }}>
                {selected.id}
              </span>
              <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="result-section">
              <h4>Extent — {selected.extent.length} Task(s)</h4>
              <div className="tags-row">
                {selected.extent.map(t => (
                  <span key={t} className="tag tag-accent">{t}</span>
                ))}
              </div>
            </div>
            <div className="result-section">
              <h4>Intent — {selected.intent.length} Attribute(s)</h4>
              <div className="tags-row">
                {selected.intent.length > 0
                  ? selected.intent.map(a => <span key={a} className="tag tag-cyan">{a}</span>)
                  : <span className="info-text">∅ (top concept — all tasks, no shared attributes)</span>
                }
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
