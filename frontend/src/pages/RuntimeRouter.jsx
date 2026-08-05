import { useState } from 'react'
import { api } from '../api'
import { Card, Spinner } from '../components/UI'
import { useToast } from '../context/ToastContext'

const SAMPLES = [
  { label: '📄 Research Report', text: 'Write a comprehensive research report on the latest developments in quantum computing, including analysis of recent papers and web sources.', tier: 'premium', urgency: 'normal' },
  { label: '💻 Code Review', text: 'Review this Python codebase for security vulnerabilities, code quality issues, and suggest refactoring opportunities.', tier: 'standard', urgency: 'high' },
  { label: '📊 Data Analysis', text: 'Analyze our Q3 sales database and generate statistical insights with SQL queries, comparing performance across regions.', tier: 'premium', urgency: 'normal' },
  { label: '⚖️ Legal Review', text: 'Review this 50-page software license agreement, identify key obligations, risks, and unusual clauses.', tier: 'premium', urgency: 'critical' },
  { label: '🐛 Bug Fix', text: 'Investigate and fix the race condition in our async Python service causing intermittent 500 errors under load.', tier: 'standard', urgency: 'critical' },
  { label: '🗄️ SQL Query', text: 'Write optimized SQL queries to find the top 10 customers by revenue for each region, with year-over-year growth rates.', tier: 'bulk', urgency: 'low' },
]

const STAGE_LABELS = [
  { num: 1, icon: '🧠', label: 'Attribute Extraction (Groq)', detail: id => id?.extracted_attributes?.length ? `Found: ${id.extracted_attributes.join(', ')}` : 'Extracting…' },
  { num: 2, icon: '⬡', label: 'Galois Closure (FCA)',         detail: id => id?.matched_concept ? `Concept: ${id.matched_concept.id}` : 'Computing closure…' },
  { num: 3, icon: '📈', label: 'Context → Pareto Select',      detail: id => id?.selected_configuration ? `Selected: ${id.selected_configuration.name}` : 'Selecting config…' },
  { num: 4, icon: '⚡', label: 'Execution (Groq)',             detail: id => id?.execution_result ? 'Done' : 'Executing…' },
]

export default function RuntimeRouter() {
  const toast = useToast()
  const [task, setTask]     = useState('')
  const [tier, setTier]     = useState('standard')
  const [urgency, setUrgency] = useState('normal')
  const [weights, setWeights] = useState({ q: 0.40, l: 0.30, c: 0.30 })
  const [loading, setLoading] = useState(false)
  const [stage, setStage]   = useState(0)  // 0 = idle, 1-4 = stages
  const [result, setResult] = useState(null)

  function loadSample(i) {
    const s = SAMPLES[i]
    setTask(s.text)
    setTier(s.tier)
    setUrgency(s.urgency)
    setResult(null)
    setStage(0)
  }

  async function routeTask() {
    if (!task.trim()) { toast('Enter a task description', 'info'); return }
    setLoading(true)
    setResult(null)
    setStage(1)

    try {
      const payload = {
        task_description: task,
        priority_quality: weights.q,
        priority_latency: weights.l,
        priority_cost:    weights.c,
        user_tier:        tier,
        urgency,
      }
      // Simulate stage progression
      const timer = setInterval(() => setStage(s => Math.min(s + 1, 4)), 1800)
      const r = await api.routeTask(payload)
      clearInterval(timer)
      setStage(4)
      setResult(r)
      toast('Task routed successfully!', 'success')
    } catch (e) {
      toast(e.message, 'error')
      setStage(0)
    } finally {
      setLoading(false)
    }
  }

  function updateWeight(k, v) { setWeights(w => ({ ...w, [k]: parseFloat(v) })) }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Runtime Router</h1>
          <p>Full LatticeForge 6-stage pipeline powered by Groq. Task → Attributes → Galois Closure → Pareto Config → Execution.</p>
        </div>
      </div>

      <div className="router-grid">
        {/* Left: input */}
        <Card title="Task Input" icon="📝">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">Task Description</label>
              <textarea
                value={task}
                onChange={e => setTask(e.target.value)}
                placeholder="Describe the task to route through LatticeForge…"
                rows={5}
              />
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">User Tier</label>
                <select value={tier} onChange={e => setTier(e.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="bulk">Bulk</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Urgency</label>
                <select value={urgency} onChange={e => setUrgency(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="weight-controls">
              {[
                { k: 'q', label: 'Quality',  c: 'var(--green)' },
                { k: 'l', label: 'Latency',  c: 'var(--yellow)' },
                { k: 'c', label: 'Cost',     c: 'var(--accent2)' },
              ].map(({ k, label, c }) => (
                <div key={k} className="weight-item">
                  <div className="weight-label">
                    <span style={{ color: c }}>{label}</span>
                    <span className="weight-val">{weights[k].toFixed(2)}</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={weights[k]}
                    onChange={e => updateWeight(k, e.target.value)} />
                </div>
              ))}
            </div>

            <div>
              <div className="input-label" style={{ marginBottom: 6 }}>Quick Examples:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SAMPLES.map((s, i) => (
                  <button key={i} className="btn btn-outline btn-sm" onClick={() => loadSample(i)}>{s.label}</button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-lg" onClick={routeTask} disabled={loading}>
              {loading ? <><Spinner /> Routing…</> : '⚡ Route & Execute'}
            </button>
          </div>
        </Card>

        {/* Right: pipeline stages */}
        <Card title="Pipeline Stages" icon="⚙️">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STAGE_LABELS.map(s => (
              <div
                key={s.num}
                className={`pipeline-stage ${stage > s.num ? 'done' : stage === s.num ? 'active' : ''}`}
                style={{ flexDirection: 'row', minWidth: 'unset', padding: '10px 14px' }}
              >
                <div style={{ marginRight: 12, fontSize: 22 }}>{s.icon}</div>
                <div>
                  <div className="pipeline-label" style={{ textAlign: 'left', fontSize: 12 }}>
                    Stage {s.num}: {s.label}
                  </div>
                  <div className="info-text" style={{ marginTop: 2 }}>
                    {stage > s.num
                      ? (result ? s.detail(result) : '✓ Done')
                      : stage === s.num
                        ? '⟳ Processing…'
                        : 'Waiting…'
                    }
                  </div>
                </div>
                {stage > s.num && (
                  <div style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: 18 }}>✓</div>
                )}
                {stage === s.num && loading && (
                  <div style={{ marginLeft: 'auto' }}><Spinner /></div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <div className="result-box">
          <div className="result-section">
            <h4>🧠 Extracted Attributes ({result.extracted_attributes?.length})</h4>
            <div className="tags-row">
              {result.extracted_attributes?.map(a => <span key={a} className="tag tag-cyan">{a}</span>)}
              {!result.extracted_attributes?.length && <span className="info-text">None extracted</span>}
            </div>
          </div>

          <div className="result-section">
            <h4>⬡ Matched Formal Concept</h4>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 14 }}>
                {result.matched_concept?.id}
              </span>
              <span className="info-text">Level {result.matched_concept?.level}</span>
              <span className="tag tag-accent">{result.matched_concept?.extent?.length} tasks</span>
              <span className="tag tag-cyan">{result.matched_concept?.intent?.length} attributes</span>
            </div>
          </div>

          <div className="result-section">
            <h4>⚙️ Selected Configuration</h4>
            {result.selected_configuration && (
              <div className="config-card pareto" style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="config-name">{result.selected_configuration.name}</div>
                  <span className="tag tag-green">✦ Pareto Selected</span>
                </div>
                <div className="metrics-row">
                  <div className="metric"><div className="metric-label">Model</div><div className="metric-value" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{result.selected_configuration.model}</div></div>
                  <div className="metric"><div className="metric-label">Quality</div><div className="metric-value quality-val">{result.selected_configuration.quality}</div></div>
                  <div className="metric"><div className="metric-label">Latency</div><div className="metric-value latency-val">{result.latency_ms?.toFixed(0)}ms</div></div>
                  <div className="metric"><div className="metric-label">Cost</div><div className="metric-value cost-val">${result.selected_configuration.cost_per_query}</div></div>
                </div>
              </div>
            )}
          </div>

          <div className="result-section">
            <h4>🤖 Routing Reasoning</h4>
            <div className="reasoning-text">{result.reasoning}</div>
          </div>

          <div className="result-section">
            <h4>📝 Execution Result</h4>
            <div className="result-text">{result.execution_result}</div>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: 12 }}>
            <span>⏱ Latency: <strong className="glow-yellow">{result.latency_ms?.toFixed(0)}ms</strong></span>
            <span>💰 Cost: <strong className="glow-cyan">${result.cost_estimate}</strong></span>
            <span>🎯 Priority: Q={result.priority_weights?.quality?.toFixed(2)} L={result.priority_weights?.latency?.toFixed(2)} C={result.priority_weights?.cost?.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
