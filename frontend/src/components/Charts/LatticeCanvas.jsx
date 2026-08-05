import { useEffect, useRef } from 'react'

export default function LatticeCanvas({ lattice }) {
  const canvasRef  = useRef(null)
  const tooltipRef = useRef(null)

  useEffect(() => {
    if (!lattice || !lattice.concepts?.length) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width  = W
    canvas.height = H

    const { concepts, edges } = lattice

    // ── Layout: layer by level ──────────────────────────────────────────
    const levels = {}
    concepts.forEach(c => {
      if (!levels[c.level]) levels[c.level] = []
      levels[c.level].push(c)
    })

    const maxLevel = Math.max(...Object.keys(levels).map(Number))
    const positions = {}

    Object.keys(levels).forEach(lvl => {
      const row   = levels[lvl]
      const y     = 40 + (Number(lvl) / Math.max(maxLevel, 1)) * (H - 80)
      const xStep = W / (row.length + 1)
      row.forEach((c, i) => {
        positions[c.id] = { x: xStep * (i + 1), y }
      })
    })

    // ── Draw edges ──────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H)
    edges.forEach(([parent, child]) => {
      const p = positions[parent]
      const c = positions[child]
      if (!p || !c) return
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(c.x, c.y)
      ctx.strokeStyle = 'rgba(99,102,241,0.3)'
      ctx.lineWidth   = 1.2
      ctx.stroke()
    })

    // ── Draw nodes ──────────────────────────────────────────────────────
    const R = 12
    concepts.forEach(c => {
      const pos = positions[c.id]
      if (!pos) return

      // Glow
      const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, R * 2.5)
      grd.addColorStop(0, 'rgba(99,102,241,0.25)')
      grd.addColorStop(1, 'rgba(99,102,241,0)')
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, R * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = grd
      ctx.fill()

      // Circle
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2)
      const grad = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 0, pos.x, pos.y, R)
      grad.addColorStop(0, '#a78bfa')
      grad.addColorStop(1, '#6366f1')
      ctx.fillStyle = grad
      ctx.shadowColor = 'rgba(99,102,241,0.8)'
      ctx.shadowBlur  = 10
      ctx.fill()
      ctx.shadowBlur  = 0

      // Label (short concept id)
      ctx.font       = '9px JetBrains Mono, monospace'
      ctx.fillStyle  = 'rgba(241,245,249,0.85)'
      ctx.textAlign  = 'center'
      ctx.fillText(c.id.slice(0, 6), pos.x, pos.y + R + 12)
    })

    // ── Tooltip on hover ────────────────────────────────────────────────
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const mx   = e.clientX - rect.left
      const my   = e.clientY - rect.top
      let found  = null

      for (const c of concepts) {
        const p = positions[c.id]
        if (!p) continue
        if (Math.hypot(mx - p.x, my - p.y) < 18) { found = c; break }
      }

      const tip = tooltipRef.current
      if (found) {
        tip.style.display = 'block'
        tip.style.left    = `${e.clientX + 12}px`
        tip.style.top     = `${e.clientY - 10}px`
        tip.innerHTML     = `
          <div style="color:var(--accent);font-family:var(--font-mono);font-size:11px;margin-bottom:6px">${found.id}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Extent (${found.extent.length} tasks):</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px">${found.extent.slice(0,4).join(', ')}${found.extent.length > 4 ? '…' : ''}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Intent (${found.intent.length} attrs):</div>
          <div style="font-size:11px;color:var(--accent3)">${found.intent.join(', ') || '∅'}</div>
        `
      } else {
        tip.style.display = 'none'
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    return () => canvas.removeEventListener('mousemove', handleMouseMove)
  }, [lattice])

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} className="lattice-canvas-el" />
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed', display: 'none',
          background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px',
          fontSize: 12, color: 'var(--text-primary)', maxWidth: 290,
          pointerEvents: 'none', zIndex: 1000, boxShadow: 'var(--shadow-glow)',
        }}
      />
    </div>
  )
}
