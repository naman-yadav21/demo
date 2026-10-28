export function EmptyState({ title = 'Nothing here yet', description }) {
  return <div className="state-panel"><span className="state-icon">—</span><h2>{title}</h2>{description && <p>{description}</p>}</div>
}
