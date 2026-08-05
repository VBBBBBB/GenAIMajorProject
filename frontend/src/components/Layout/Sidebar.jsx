const NAV = [
  { section: 'Overview', items: [{ id: 'overview', icon: '🏠', label: 'Dashboard' }] },
  {
    section: 'Phase 1 — FCA', items: [
      { id: 'context', icon: '⊞', label: 'Formal Context' },
      { id: 'lattice', icon: '⬡', label: 'Concept Lattice' },
      { id: 'galois',  icon: '⊕', label: 'Galois Closure' },
    ],
  },
  { section: 'Phase 2 — Pareto', items: [{ id: 'pareto', icon: '📈', label: 'Pareto Frontier' }] },
  { section: 'Phase 3 — Router', items: [{ id: 'router', icon: '⚡', label: 'Runtime Router', badge: 'Groq' }] },
  { section: 'Phase 4 — Refactor', items: [{ id: 'refactor', icon: '🔄', label: 'Self-Refactoring' }] },
  { section: 'Telemetry', items: [{ id: 'telemetry', icon: '📡', label: 'Telemetry' }] },
]

export default function Sidebar({ current, onNavigate }) {
  return (
    <nav className="sidebar">
      {NAV.map(group => (
        <div key={group.section}>
          <div className="sidebar-section">{group.section}</div>
          {group.items.map(item => (
            <div
              key={item.id}
              className={`nav-item ${current === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          ))}
        </div>
      ))}
    </nav>
  )
}
