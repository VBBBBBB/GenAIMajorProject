import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Spinner } from '../components/UI'
import { useToast } from '../context/ToastContext'

export default function GaloisClosure() {
  const toast = useToast()
  const [attrs, setAttrs]     = useState([])
  const [labels, setLabels]   = useState({})
  const [selected, setSelected] = useState(new Set())
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getContext().then(d => {
      setAttrs(d.attributes ?? [])
      setLabels(d.attribute_labels ?? {})
    }).catch(() => {})
  }, [])

  function toggleAttr(a) {
    setSelected(s => {
      const n = new Set(s)
      n.has(a) ? n.delete(a) : n.add(a)
      return n
    })
    setResult(null)
  }

  async function compute() {
    if (selected.size === 0) { toast('Select at least one attribute', 'info'); return }
    setLoading(true)
    try {
      setResult(await api.galoisClosure([...selected]))
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Galois Closure</h1>
          <p>Navigate the lattice to find the exact smallest formal concept covering a selected attribute set.</p>
        </div>
      </div>

      <div className="grid-2">
        <Card title="Query Attributes" icon="⊕">
          <p className="info-text" style={{ marginBottom: 14 }}>
            Select capability attributes. The Galois closure B″ = (B′)′ gives the smallest formal concept
            whose intent contains all selected attributes — <strong>mathematically exact</strong>, not fuzzy.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {attrs.map(a => (
              <button
                key={a}
                onClick={() => toggleAttr(a)}
                className={`tag ${selected.has(a) ? 'tag-accent' : 'tag-muted'}`}
                style={{ cursor: 'pointer', border: '1px solid', fontSize: 12, padding: '4px 12px' }}
              >
                {selected.has(a) ? '✓ ' : ''}{labels[a] ?? a}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <div style={{ marginBottom: 12 }}>
              <span className="info-text">Selected: </span>
              {[...selected].map(a => (
                <span key={a} className="tag tag-accent" style={{ marginRight: 4 }}>{labels[a] ?? a}</span>
              ))}
            </div>
          )}
          <button className="btn btn-primary" onClick={compute} disabled={loading || selected.size === 0}>
            {loading ? <Spinner /> : '⊕'} Compute Galois Closure
          </button>
        </Card>

        <Card title="Closure Result" icon="🎯">
          {!result && !loading && (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-icon">⊕</div>
              <p>Select attributes and click Compute</p>
            </div>
          )}
          {loading && <div style={{ textAlign: 'center', padding: 32 }}><Spinner /></div>}
          {result && (
            <div>
              <div className="result-section">
                <h4>Query</h4>
                <div className="tags-row">
                  {result.query_attributes?.map(a => (
                    <span key={a} className={`tag ${result.valid_attributes?.includes(a) ? 'tag-cyan' : 'tag-red'}`}>{a}</span>
                  ))}
                </div>
              </div>

              {result.gap_detected ? (
                <div style={{ padding: 16, background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ color: 'var(--red)', fontWeight: 700, marginBottom: 8 }}>⚠ Capability Gap Detected</div>
                  <p className="info-text">No formal concept covers this attribute set. Consider adding a new tool.</p>
                </div>
              ) : (
                <>
                  <div className="result-section">
                    <h4>Galois Closure — Extent B′ ({result.galois_extent?.length} tasks)</h4>
                    <div className="tags-row">
                      {result.galois_extent?.map(t => <span key={t} className="tag tag-accent">{t}</span>)}
                    </div>
                  </div>
                  <div className="result-section">
                    <h4>Closure — Intent B″ ({result.galois_intent?.length} attrs)</h4>
                    <div className="tags-row">
                      {result.galois_intent?.map(a => <span key={a} className="tag tag-cyan">{a}</span>)}
                    </div>
                  </div>
                  <div className="result-section">
                    <h4>Matched Formal Concept</h4>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)', marginBottom: 6 }}>
                      {result.matched_concept?.id}
                    </div>
                    <div className="info-text">Level {result.matched_concept?.level} · {result.matched_concept?.extent?.length} tasks · {result.matched_concept?.intent?.length} attributes</div>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
