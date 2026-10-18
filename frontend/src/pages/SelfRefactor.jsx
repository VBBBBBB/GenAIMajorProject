import { useEffect, useState } from 'react'
import { api } from '../api'
import { Spinner, Icon } from '../components/UI'
import { useToast } from '../context/ToastContext'

export default function SelfRefactor() {
  const toast = useToast()
  const [attrs, setAttrs]   = useState([])
  const [maintResult, setMaintResult] = useState(null)
  const [maintLoading, setMaintLoading] = useState(false)

  // Add tool state
  const [addName,  setAddName]  = useState('')
  const [addLabel, setAddLabel] = useState('')
  const [addTasks, setAddTasks] = useState('')
  const [addResult, setAddResult] = useState(null)
  const [addLoading, setAddLoading] = useState(false)

  // Remove tool state
  const [removeTool, setRemoveTool] = useState('')
  const [removeResult, setRemoveResult] = useState(null)
  const [removeLoading, setRemoveLoading] = useState(false)

  // Redundancy state
  const [redTool, setRedTool]     = useState('')
  const [redResult, setRedResult] = useState(null)
  const [redLoading, setRedLoading] = useState(false)

  // Gap detection state
  const [gapSelected, setGapSelected] = useState(new Set())
  const [gapResult, setGapResult]     = useState(null)
  const [gapLoading, setGapLoading]   = useState(false)

  useEffect(() => {
    api.getContext().then(d => {
      setAttrs(d.attributes ?? [])
      setRemoveTool(d.attributes?.[0] ?? '')
      setRedTool(d.attributes?.[0] ?? '')
    }).catch(() => {})
  }, [])

  async function runMaintenance() {
    setMaintLoading(true)
    try {
      setMaintResult(await api.maintenanceCycle())
      toast('Maintenance cycle complete', 'success')
    } catch (e) { toast(e.message, 'error') } finally { setMaintLoading(false) }
  }

  async function handleAddTool() {
    if (!addName || !addLabel) { toast('Fill tool name and label', 'info'); return }
    setAddLoading(true)
    try {
      const r = await api.addTool({
        action: 'add', tool_name: addName, tool_label: addLabel,
        affected_tasks: addTasks.split(',').map(s => s.trim()).filter(Boolean),
      })
      setAddResult(r)
      toast(r.message, 'success')
      const d = await api.getContext()
      setAttrs(d.attributes ?? [])
    } catch (e) { toast(e.message, 'error') } finally { setAddLoading(false) }
  }

  async function handleRemoveTool() {
    if (!removeTool) return
    setRemoveLoading(true)
    try {
      const r = await api.removeTool({ action: 'remove', tool_name: removeTool, tool_label: removeTool, affected_tasks: [] })
      setRemoveResult(r)
      toast(r.message, 'success')
      const d = await api.getContext()
      setAttrs(d.attributes ?? [])
      setRemoveTool(d.attributes?.[0] ?? '')
    } catch (e) { toast(e.message, 'error') } finally { setRemoveLoading(false) }
  }

  async function handleRedundancy() {
    if (!redTool) return
    setRedLoading(true)
    try { setRedResult(await api.checkRedundancy(redTool)) }
    catch (e) { toast(e.message, 'error') } finally { setRedLoading(false) }
  }

  async function handleGapDetect() {
    if (gapSelected.size === 0) { toast('Select at least one attribute', 'info'); return }
    setGapLoading(true)
    try { setGapResult(await api.detectGap([...gapSelected])) }
    catch (e) { toast(e.message, 'error') } finally { setGapLoading(false) }
  }

  function toggleGapAttr(a) {
    setGapSelected(s => { const n = new Set(s); n.has(a) ? n.delete(a) : n.add(a); return n })
    setGapResult(null)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Self-Refactoring Engine</h1>
          <p>4 mathematical operations: incremental lattice updates, redundancy proofs, gap detection, Pareto recomputation.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={runMaintenance} disabled={maintLoading}>
          {maintLoading ? <Spinner /> : <Icon name="refresh" size={14} />} Full Maintenance Cycle
        </button>
      </div>

      {maintResult && (
        <pre className="result-json" style={{ marginBottom: 20 }}>
          {JSON.stringify(maintResult, null, 2)}
        </pre>
      )}

      <div className="refactor-ops">

        {/* Op 1: Add Tool */}
        <div className="op-card">
          <div className="op-title"><div className="op-num">1</div>Incremental Lattice Update — Add Tool</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="input-group"><label className="input-label">Tool Internal Name</label>
              <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="e.g., vector_search" />
            </div>
            <div className="input-group"><label className="input-label">Tool Display Label</label>
              <input value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="e.g., Vector Search" />
            </div>
            <div className="input-group"><label className="input-label">Affected Tasks (comma-separated)</label>
              <input value={addTasks} onChange={e => setAddTasks(e.target.value)} placeholder="e.g., Research Report, Data Analysis" />
            </div>
            <button className="btn btn-success btn-sm" onClick={handleAddTool} disabled={addLoading}>
              {addLoading ? <Spinner /> : <Icon name="plus" size={14} />} Add Tool
            </button>
            {addResult && <pre className="result-json">{JSON.stringify(addResult, null, 2)}</pre>}
          </div>
        </div>

        {/* Op 1b: Remove Tool */}
        <div className="op-card">
          <div className="op-title"><div className="op-num">1</div>Incremental Lattice Update — Remove Tool</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p className="info-text">Remove an attribute from the formal context and recompute the lattice incrementally.</p>
            <div className="input-group"><label className="input-label">Select Tool to Remove</label>
              <select value={removeTool} onChange={e => setRemoveTool(e.target.value)}>
                {attrs.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleRemoveTool} disabled={removeLoading}>
              {removeLoading ? <Spinner /> : <Icon name="trash" size={14} />} Remove Tool
            </button>
            {removeResult && <pre className="result-json">{JSON.stringify(removeResult, null, 2)}</pre>}
          </div>
        </div>

        {/* Op 3: Redundancy Proof */}
        <div className="op-card">
          <div className="op-title"><div className="op-num">3</div>Redundancy Proof</div>
          <p className="info-text" style={{ marginBottom: 12 }}>
            Tool T is redundant if every task requiring T is also covered by some other concept that doesn't require T.
            FCA provides a lattice-theoretic proof.
          </p>
          <div className="input-group" style={{ marginBottom: 10 }}><label className="input-label">Select Tool</label>
            <select value={redTool} onChange={e => setRedTool(e.target.value)}>
              {attrs.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleRedundancy} disabled={redLoading}>
            {redLoading ? <Spinner /> : <Icon name="search" size={14} />} Check Redundancy
          </button>
          {redResult && (
            <div style={{ marginTop: 10 }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: redResult.is_redundant ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${redResult.is_redundant ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                marginBottom: 8,
              }}>
                <strong style={{ color: redResult.is_redundant ? 'var(--red)' : 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {redResult.is_redundant
                    ? <><Icon name="alert" size={14} /> REDUNDANT</>
                    : <><Icon name="check" size={14} /> NOT REDUNDANT</>}
                </strong>
              </div>
              <pre className="result-json">{JSON.stringify(redResult, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Op 4: Gap Detection */}
        <div className="op-card">
          <div className="op-title"><div className="op-num">4</div>Missing Capability Detection</div>
          <p className="info-text" style={{ marginBottom: 12 }}>
            If an attribute set has no covering concept, the system identifies the exact capability gap.
            Not "low similarity" — exact missing attributes.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {attrs.map(a => (
              <button key={a} className={`tag ${gapSelected.has(a) ? 'tag-accent' : 'tag-muted'}`}
                style={{ cursor: 'pointer', border: '1px solid', fontSize: 11 }}
                onClick={() => toggleGapAttr(a)}
              >{gapSelected.has(a) ? '✓ ' : ''}{a}</button>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleGapDetect} disabled={gapLoading || gapSelected.size === 0}>
            {gapLoading ? <Spinner /> : <Icon name="search" size={14} />} Detect Gap
          </button>
          {gapResult && (
            <div style={{ marginTop: 10 }}>
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 8,
                background: gapResult.has_covering_concept ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${gapResult.has_covering_concept ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
              }}>
                <strong style={{ color: gapResult.has_covering_concept ? 'var(--green)' : 'var(--yellow)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {gapResult.has_covering_concept
                    ? <><Icon name="check" size={14} /> COVERED</>
                    : <><Icon name="alert" size={14} /> GAP DETECTED</>}
                </strong>
              </div>
              <pre className="result-json">{JSON.stringify(gapResult, null, 2)}</pre>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
