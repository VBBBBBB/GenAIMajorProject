import { Icon } from '../UI'

const NAV = [
  { section: 'Overview', items: [{ id: 'overview', icon: 'dashboard', label: 'Dashboard' }] },
  {
    section: 'Phase 1 — FCA', items: [
      { id: 'context', icon: 'table', label: 'Formal Context' },
      { id: 'lattice', icon: 'network', label: 'Concept Lattice' },
      { id: 'galois',  icon: 'closure', label: 'Galois Closure' },
    ],
  },
  { section: 'Phase 2 — Pareto', items: [{ id: 'pareto', icon: 'trending', label: 'Pareto Frontier' }] },
  { section: 'Phase 3 — Router', items: [{ id: 'router', icon: 'zap', label: 'Runtime Router', badge: 'Groq' }] },
  { section: 'Phase 4 — Refactor', items: [{ id: 'refactor', icon: 'refresh', label: 'Self-Refactoring' }] },
  { section: 'Telemetry', items: [{ id: 'telemetry', icon: 'activity', label: 'Telemetry' }] },
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
              <span className="nav-icon"><Icon name={item.icon} size={16} /></span>
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          ))}
        </div>
      ))}
    </nav>
  )
}
