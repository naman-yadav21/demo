import { Construction } from 'lucide-react'
import { PageContainer } from '../components/common/PageContainer.jsx'

export function PlaceholderPage({ title, standalone = false }) {
  const content = <div className="placeholder-card"><div className="placeholder-icon"><Construction size={21} /></div><div><h2>{title} screen</h2><p>This is a placeholder. Screen layout and behavior will be based on the application reference you provide.</p></div><span className="status-badge status-neutral">In preparation</span></div>
  if (standalone) return <div className="standalone-page"><PageContainer title={title}>{content}</PageContainer></div>
  return <PageContainer title={title}>{content}</PageContainer>
}
