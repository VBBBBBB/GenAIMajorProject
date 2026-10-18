// Central API service — all calls to FastAPI backend
const BASE = '/api'

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

export const api = {
  // ── Health & Benchmark ───────────────────────────────────────────────────
  health: () => req('GET', '/health'),
  getBenchmark: () => req('GET', '/benchmark/random'),

  // ── Formal Context ─────────────────────────────────────────────────────
  getContext:   () => req('GET', '/context'),
  updateCell:   (task, attribute, value) =>
    req('POST', `/context/update-cell?task=${encodeURIComponent(task)}&attribute=${encodeURIComponent(attribute)}&value=${value}`),

  // ── Lattice ─────────────────────────────────────────────────────────────
  getLattice:     () => req('GET', '/lattice'),
  galoisClosure:  (attrs) => req('POST', '/lattice/galois-closure', attrs),

  // ── Pareto ──────────────────────────────────────────────────────────────
  getParetoForConcept: (id) => req('GET', `/pareto/${id}`),
  getPoolConfigs:      (pool = 'default') => req('GET', `/pareto/pool/${pool}`),
  selectConfig:        (conceptId, wq, wl, wc) =>
    req('POST', `/pareto/select?concept_id=${conceptId}&weight_quality=${wq}&weight_latency=${wl}&weight_cost=${wc}`),
  selectPoolConfig:    (pool, wq, wl, wc) =>
    req('POST', `/pareto/select-pool?pool=${encodeURIComponent(pool)}&weight_quality=${wq}&weight_latency=${wl}&weight_cost=${wc}`),

  // ── Router ───────────────────────────────────────────────────────────────
  routeTask:           (payload) => req('POST', '/route', payload),
  extractAttributes:   (desc) =>
    req('POST', `/route/extract-attributes?task_description=${encodeURIComponent(desc)}`),

  // ── Self-Refactoring ─────────────────────────────────────────────────────
  addTool:         (payload) => req('POST', '/refactor/add-tool', payload),
  removeTool:      (payload) => req('POST', '/refactor/remove-tool', payload),
  checkRedundancy: (tool)    => req('GET', `/refactor/redundancy/${encodeURIComponent(tool)}`),
  detectGap:       (attrs)   => req('POST', '/refactor/gap-detection', attrs),
  maintenanceCycle:() => req('POST', '/refactor/maintenance-cycle'),
  recomputePareto: () => req('POST', '/refactor/recompute-pareto'),

  // ── Telemetry ────────────────────────────────────────────────────────────
  getTelemetry:   () => req('GET', '/telemetry'),
  getEntries:     (limit = 50) => req('GET', `/telemetry/entries?limit=${limit}`),
}
