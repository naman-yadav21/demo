import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { TopNavigation } from './TopNavigation.jsx'
import { useState } from 'react'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  return (
    <div className={`app-shell${menuOpen ? ' mobile-menu-open' : ''}${sidebarCollapsed ? '' : ' sidebar-expanded'}`}>
      {menuOpen && <button type="button" className="mobile-menu-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)} onNavigate={() => setMenuOpen(false)} />
      <div className="app-main">
        <TopNavigation isMenuOpen={menuOpen} onMenuClick={() => setMenuOpen((open) => !open)} />
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  )
}
