export function PageContainer({ title, description, children }) {
  return <section className="page-container"><div className="page-heading"><div><p className="eyebrow">TRAVEL DESK</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div></div>{children}</section>
}
