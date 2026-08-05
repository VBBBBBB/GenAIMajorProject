import Plot from 'react-plotly.js'

export default function ParetoChart({ configs, paretoFrontIds }) {
  if (!configs?.length) return null

  const isPareto = c => paretoFrontIds?.includes(c.id)

  const paretoConfigs   = configs.filter(isPareto)
  const dominatedConfigs = configs.filter(c => !isPareto(c))

  const mkTrace = (arr, name, color, size, symbol) => ({
    x: arr.map(c => c.latency_ms),
    y: arr.map(c => c.quality),
    z: arr.map(c => c.cost_per_query),
    text: arr.map(c => c.name),
    mode: 'markers',
    type: 'scatter3d',
    name,
    marker: { size, color, symbol, opacity: 0.9,
      line: { color: 'rgba(255,255,255,0.2)', width: 1 } },
    hovertemplate:
      '<b>%{text}</b><br>Latency: %{x}ms<br>Quality: %{y}<br>Cost: $%{z:.4f}<extra></extra>',
  })

  const data = [
    mkTrace(paretoConfigs,   '✦ Pareto Optimal', '#10b981', 10, 'diamond'),
    mkTrace(dominatedConfigs,'● Dominated',       '#475569',  6, 'circle'),
  ]

  // Pareto front connecting line
  if (paretoConfigs.length > 1) {
    const sorted = [...paretoConfigs].sort((a, b) => a.latency_ms - b.latency_ms)
    data.push({
      x: sorted.map(c => c.latency_ms),
      y: sorted.map(c => c.quality),
      z: sorted.map(c => c.cost_per_query),
      mode: 'lines',
      type: 'scatter3d',
      name: 'Frontier',
      line: { color: 'rgba(167,139,250,0.5)', width: 3, dash: 'dot' },
      hoverinfo: 'none',
    })
  }

  const layout = {
    paper_bgcolor: 'rgba(17,24,39,0)',
    plot_bgcolor:  'rgba(17,24,39,0)',
    scene: {
      bgcolor: 'rgba(17,24,39,0)',
      xaxis: { title: 'Latency (ms)', color: '#94a3b8', gridcolor: 'rgba(99,102,241,0.15)', showbackground: false },
      yaxis: { title: 'Quality',      color: '#94a3b8', gridcolor: 'rgba(99,102,241,0.15)', showbackground: false },
      zaxis: { title: 'Cost ($)',      color: '#94a3b8', gridcolor: 'rgba(99,102,241,0.15)', showbackground: false },
    },
    legend: { font: { color: '#94a3b8', size: 12 }, bgcolor: 'rgba(0,0,0,0)' },
    margin: { l: 0, r: 0, t: 10, b: 0 },
    font:   { family: 'Inter, sans-serif', color: '#94a3b8' },
  }

  return (
    <Plot
      data={data}
      layout={layout}
      style={{ width: '100%', height: 420 }}
      config={{ displayModeBar: false, responsive: true }}
    />
  )
}
