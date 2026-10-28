import { LogOut, Menu, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDemoAuth } from '../../context/DemoAuthContext.jsx'
import { ROUTES } from '../../routes/paths.js'
import { ROLE_LABELS } from '../../constants/demoUsers.js'

export function TopNavigation({ isMenuOpen, onMenuClick }) {
  const navigate = useNavigate()
  const { logout, user } = useDemoAuth()
  const displayName = user?.name || 'Travel Desk user'
  const roleLabel = ROLE_LABELS[user?.role] || 'Travel Desk user'
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  function handleLogout() {
    logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <header className="topbar">
      <button className="icon-button menu-button" type="button" aria-label="Toggle navigation" aria-expanded={isMenuOpen} onClick={onMenuClick}><Menu size={19} /></button>
      <div className="topbar-context"><ShieldCheck size={15} /><span>Travel Desk workspace</span></div>
      <div className="topbar-spacer" />
      <div className="profile-button" title={roleLabel}><span className="avatar" aria-hidden="true">{initials}</span><span className="profile-name">{displayName}</span><span className="profile-role">{roleLabel}</span></div>
      <button className="logout-button" type="button" onClick={handleLogout}><LogOut size={16} /><span>Log out</span></button>
    </header>
  )
}
