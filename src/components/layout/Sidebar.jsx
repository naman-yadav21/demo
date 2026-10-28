import { useLocation, useNavigate } from 'react-router-dom'
import { BadgeCheck, BriefcaseBusiness, CheckCheck, ChevronLeft, ChevronRight, ClipboardList, House, PlaneTakeoff, WalletCards } from 'lucide-react'
import { ROUTES } from '../../routes/paths.js'
import { useDemoAuth } from '../../context/DemoAuthContext.jsx'
import { ROLE_LABELS } from '../../constants/demoUsers.js'
import { ROLE_SCREEN_ACCESS } from '../../routes/roleAccess.js'
import { NetlinkLogo } from '../common/NetlinkLogo.jsx'

const links = [
  { label: 'Home', path: ROUTES.welcome, screen: 'home', icon: House },
  { label: 'New travel request', path: ROUTES.newRequest, screen: 'newRequest', icon: PlaneTakeoff },
  { label: 'My travel requests', path: ROUTES.requests, screen: 'myRequests', icon: ClipboardList },
  { label: 'Reporting manager approvals', path: ROUTES.approvals, screen: 'managerApprovals', icon: CheckCheck },
  { label: 'LOB approvals', path: ROUTES.lobApprovals, screen: 'lobApprovals', icon: BadgeCheck },
  { label: 'Travel desk operations', path: ROUTES.travelDesk, screen: 'travelDesk', icon: BriefcaseBusiness },
  { label: 'Finance approvals', path: ROUTES.finance, screen: 'financeApprovals', icon: WalletCards },
]

export function Sidebar({ collapsed, onToggle, onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useDemoAuth()
  const accessibleLinks = links.filter((link) => ROLE_SCREEN_ACCESS[user?.role]?.includes(link.screen))
  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`} aria-label="Main navigation">
      <div className="sidebar-brand-row">
        <div className="brand-mark"><NetlinkLogo size={31} variant="icon" /><span>NETLINK</span></div>
        <button type="button" className="sidebar-toggle" onClick={onToggle} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>
      <div className="workspace-label">TRAVEL DESK</div>
      <nav className="nav-list">
        {accessibleLinks.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path
            || (path === ROUTES.requests && location.pathname.startsWith(path))
            || (path === ROUTES.travelDesk && location.pathname.startsWith(`${path}/`))
          return <button type="button" key={path} title={label} aria-label={label} className={`nav-item${active ? ' active' : ''}`} onClick={() => { navigate(path); onNavigate?.() }} aria-current={active ? 'page' : undefined}>
            {Icon && <Icon size={18} strokeWidth={1.8} />}<span>{label}</span>
          </button>
        })}
      </nav>
      <div className="sidebar-note">Signed in as {ROLE_LABELS[user?.role] || 'Travel Desk user'}</div>
    </aside>
  )
}
