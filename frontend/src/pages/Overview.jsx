import { Fragment, useEffect, useState } from 'react'
import { api } from '../api'
import { StatCard, Card, Spinner, ProgressBar, Icon } from '../components/UI'

const PIPELINE_STAGES = [
  { num: 1, icon: 'edit', label: 'Task Input' },
  { num: 2, icon: 'cpu', label: 'Attribute Extractor' },
  { num: 3, icon: 'closure', label: 'Galois Closure' },
  { num: 4, icon: 'trending', label: 'Pareto Select' },
  { num: 5, icon: 'zap', label: 'Execute (Groq)' },
  { num: 6, icon: 'activity', label: 'Telemetry Log' },
]

export default function Overview({ onNavigate }) {
  const [latticeStats, setLatticeStats] = useState(null)
  const [ctx, setCtx]      = useState(null)
  const [telem, setTelem]  = useState(null)
  const [maint, setMaint]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [benchmarkResult, setBenchmarkResult] = useState(null)
  const [benchmarkLoading, setBenchmarkLoading] = useState(false)

  useEffect(() => {
    api.getLattice()
      .then(d => setLatticeStats({ concepts: d.stats?.num_concepts, edges: d.stats?.num_edges }))
      .catch(() => {})
    api.getContext()
      .then(d => setCtx({ tasks: d.tasks?.length, attrs: d.attributes?.length }))
      .catch(() => {})
    api.getTelemetry()
      .then(setTelem)
      .catch(() => {})
  }, [])

  async function runMaintenance() {
    setLoading(true)
    try {
      const r = await api.maintenanceCycle()
      setMaint(r)
    } catch (e) {
      setMaint({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function runBenchmark() {
    setBenchmarkLoading(true)
    try {
      setBenchmarkResult(await api.getBenchmark())
    } catch (e) {
      console.error(e)
    } finally {
      setBenchmarkLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>LatticeForge Dashboard</h1>
          <p>Pareto-Optimal Agent Capability Refactoring via Formal Concept Analysis</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Formal Concepts" value={latticeStats?.concepts} sub="in concept lattice" />
        <StatCard label="Total Tasks"     value={ctx?.tasks}            sub="capability objects" />
        <StatCard label="Attributes"      value={ctx?.attrs}            sub="capability dimensions" />
        <StatCard label="Executions"      value={telem?.total_executions ?? 0} sub="routed via LatticeForge" />
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Pipeline */}
        <Card title="Architecture Pipeline" icon="workflow">
          <div className="pipeline">
            {PIPELINE_STAGES.map((s, i) => (
              <Fragment key={s.num}>
                <div className="pipeline-stage done">
                  <div className="stage-num">{s.num}</div>
                  <div className="pipeline-icon"><Icon name={s.icon} size={24} /></div>
                  <div className="pipeline-label">{s.label}</div>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="pipeline-arrow">→</div>
                )}
              </Fragment>
            ))}
          </div>
        </Card>

        {/* Avg metrics */}
        <Card title="Avg Execution Metrics" icon="chart">
          {telem && telem.total_executions > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span className="glow-green">Quality</span>
                  <span className="glow-green">{telem.avg_quality?.toFixed(3)}</span>
                </div>
                <ProgressBar value={telem.avg_quality} color="linear-gradient(90deg,#10b981,#34d399)" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span className="glow-yellow">Avg Latency</span>
                  <span className="glow-yellow">{telem.avg_latency_ms?.toFixed(0)}ms</span>
                </div>
                <ProgressBar value={Math.min(telem.avg_latency_ms / 5000, 1)} color="linear-gradient(90deg,#f59e0b,#fbbf24)" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span className="glow-cyan">Avg Cost</span>
                  <span className="glow-cyan">${telem.avg_cost?.toFixed(4)}</span>
                </div>
                <ProgressBar value={Math.min(telem.avg_cost / 0.2, 1)} color="linear-gradient(90deg,#22d3ee,#67e8f9)" />
              </div>
            </div>
          ) : (
            <p className="info-text" style={{ marginTop: 12 }}>No executions yet. Route a task to see metrics.</p>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card title="Quick Actions" icon="zap">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <button className="btn btn-primary"  onClick={() => onNavigate('router')}><Icon name="zap" size={14} /> Route a Task</button>
          <button className="btn btn-outline"  onClick={runBenchmark} disabled={benchmarkLoading}>
            {benchmarkLoading ? <Spinner /> : <Icon name="target" size={14} />} Run Proof Benchmark
          </button>
          <button className="btn btn-outline"  onClick={() => onNavigate('lattice')}><Icon name="network" size={14} /> View Lattice</button>
          <button className="btn btn-outline"  onClick={() => onNavigate('pareto')}><Icon name="trending" size={14} /> Pareto Frontier</button>
          <button className="btn btn-success"  onClick={runMaintenance} disabled={loading}>
            {loading ? <Spinner /> : <Icon name="refresh" size={14} />} Maintenance Cycle
          </button>
        </div>
        {maint && (
          <pre className="result-json" style={{ marginTop: 14 }}>
            {JSON.stringify(maint, null, 2)}
          </pre>
        )}
      </Card>

      {/* Benchmark Results Display */}
      {benchmarkResult && (
        <Card title="Empirical Proof: FCA vs Vector Search" icon="target" style={{ marginTop: 24, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
              <div className="info-text" style={{ marginBottom: 4 }}>Random Task:</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>"{benchmarkResult.task_description}"</div>
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <span className="info-text">Required Capabilities:</span>{' '}
                {benchmarkResult.required_attributes.map(a => <span key={a} className="tag tag-cyan" style={{ marginLeft: 4 }}>{a}</span>)}
              </div>
            </div>

            <div className="grid-2">
              {/* Baseline */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  Standard Vector Search
                  {benchmarkResult.vector_search.success ? <span className="tag tag-green">SUCCESS</span> : <span className="tag tag-red">FAIL</span>}
                </h4>
                <div style={{ fontSize: 12, marginBottom: 8 }}><span className="info-text">Retrieved Tools:</span> {benchmarkResult.vector_search.retrieved_tools.join(', ')}</div>
                {!benchmarkResult.vector_search.success && (
                  <>
                    <div style={{ fontSize: 12, marginBottom: 8, color: 'var(--red)' }}><span className="info-text">Missing:</span> {benchmarkResult.vector_search.missing_attributes.join(', ')}</div>
                    <div style={{ fontSize: 11, background: 'rgba(239,68,68,0.1)', padding: 8, borderRadius: 4, color: 'var(--red)', marginBottom: 12 }}>
                      <strong>Why it failed:</strong> {benchmarkResult.trap_rationale}
                    </div>
                  </>
                )}
                <div style={{ marginTop: 'auto' }}>
                  <div className="info-text" style={{ fontSize: 11, marginBottom: 4 }}>Agent Execution Output:</div>
                  <pre style={{ 
                    fontFamily: 'var(--font-mono)', fontSize: 11, padding: 10, borderRadius: 4, 
                    background: benchmarkResult.vector_search.success ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                    border: `1px solid ${benchmarkResult.vector_search.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    color: benchmarkResult.vector_search.success ? 'var(--text-primary)' : 'var(--red)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {'> '}{benchmarkResult.vector_search.execution_output}
                  </pre>
                </div>
              </div>

              {/* LatticeForge */}
              <div style={{ border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: 16, background: 'rgba(99,102,241,0.05)', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ color: 'var(--accent3)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  LatticeForge (FCA)
                  {benchmarkResult.latticeforge.success ? <span className="tag tag-green">SUCCESS</span> : <span className="tag tag-red">FAIL</span>}
                </h4>
                <div style={{ fontSize: 12, marginBottom: 8 }}><span className="info-text">Retrieved Tools:</span> {benchmarkResult.latticeforge.retrieved_tools.join(', ')}</div>
                {benchmarkResult.latticeforge.success && (
                  <div style={{ fontSize: 11, background: 'rgba(16,185,129,0.1)', padding: 8, borderRadius: 4, color: 'var(--green)', marginBottom: 12 }}>
                    <strong>Proof:</strong> Exact mathematical capability coverage via Galois Closure.
                  </div>
                )}
                <div style={{ marginTop: 'auto' }}>
                  <div className="info-text" style={{ fontSize: 11, marginBottom: 4 }}>Agent Execution Output:</div>
                  <pre style={{ 
                    fontFamily: 'var(--font-mono)', fontSize: 11, padding: 10, borderRadius: 4, 
                    background: benchmarkResult.latticeforge.success ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                    border: `1px solid ${benchmarkResult.latticeforge.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    color: benchmarkResult.latticeforge.success ? 'var(--text-primary)' : 'var(--red)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {'> '}{benchmarkResult.latticeforge.execution_output}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
