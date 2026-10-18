import Icon from './Icon'

export { Icon }

export function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color, WebkitTextFillColor: color } : {}}>{value ?? '–'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export function Tag({ children, type = 'accent' }) {
  return <span className={`tag tag-${type}`}>{children}</span>
}

export function Spinner() {
  return <span className="spinner" />
}

export function EmptyState({ icon = 'inbox', message }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} size={40} strokeWidth={1.5} /></div>
      <p>{message}</p>
    </div>
  )
}

export function ResultJson({ data }) {
  if (!data) return null
  return (
    <pre className="result-json">
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </pre>
  )
}

export function ProgressBar({ value, color }) {
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar" style={{ width: `${Math.min(100, value * 100)}%`, background: color }} />
    </div>
  )
}

export function Card({ title, icon, extra, children, style }) {
  return (
    <div className="card" style={style}>
      {(title || icon) && (
        <div className="card-header">
          <div className="card-title">
            {icon && <Icon name={icon} size={16} className="card-icon" />}
            {title}
          </div>
          {extra}
        </div>
      )}
      {children}
    </div>
  )
}
