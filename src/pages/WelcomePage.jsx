import { ArrowRight, ArrowUpRight, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, ClipboardCheck, Globe2, Luggage, MapPinned, Plane, ShieldCheck, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes/paths.js'
import { useDemoAuth } from '../context/DemoAuthContext.jsx'
import { APP_ROLES } from '../constants/demoUsers.js'
import { NetlinkLogo } from '../components/common/NetlinkLogo.jsx'

const workflow = [
  'Raise a travel request',
  'Manager approval and validation',
  'Functional manager approval',
  'Travel desk shares budget',
  'Finance approval',
  'Booking confirmation',
]

function TravelArtwork() {
  return (
    <div className="welcome-art" aria-hidden="true">
      <div className="art-world"><Globe2 size={138} strokeWidth={0.7} /></div>
      <div className="art-route art-route-a" /><div className="art-route art-route-b" />
      <span className="art-pin pin-a"><MapPinned size={17} /></span>
      <span className="art-pin pin-b"><MapPinned size={17} /></span>
      <span className="art-pin pin-c"><MapPinned size={17} /></span>
      <div className="art-plane"><Plane size={62} strokeWidth={1.3} /></div>
      <div className="art-suitcase"><Luggage size={39} strokeWidth={1.4} /><span>TRAVEL</span></div>
      <div className="art-pass"><span className="pass-emblem">N</span><span>BOARDING PASS</span><i /></div>
      <div className="art-orb" />
      <div className="art-status"><span><Check size={13} /></span><div><strong>Ready for your next trip</strong><small>Your travel workspace awaits</small></div></div>
    </div>
  )
}

export function WelcomePage() {
  const navigate = useNavigate()
  const { user } = useDemoAuth()
  const isEmployee = user?.role === APP_ROLES.EMPLOYEE
  const isAdministrator = user?.role === APP_ROLES.ADMIN
  return (
    <div className="welcome-page">
      <section className="welcome-hero">
        <div className="hero-map-dots" />
        <div className="hero-swoosh hero-swoosh-one" /><div className="hero-swoosh hero-swoosh-two" />
        <div className="hero-cityline" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
        <div className="welcome-hero-content">
          <div className="welcome-brand-line"><NetlinkLogo size={31} variant="icon" /><span>Netlink</span><i /><span>TRAVEL DESK MANAGEMENT</span></div>
          <p className="welcome-kicker"><Sparkles size={14} /> YOUR BUSINESS JOURNEY, MADE SIMPLE</p>
          <h1>Manage employee travel<br /><span>&amp; expenses with ease.</span></h1>
          <p className="welcome-lede">Handle bookings, track expenses, and move every business trip forward in one seamless workspace.</p>
          <div className="welcome-actions">
            <button type="button" className="welcome-primary-action" onClick={() => navigate(ROUTES.newRequest)}>New travel request <ArrowRight size={17} /></button>
            {user?.role === APP_ROLES.REPORTING_MANAGER && <button type="button" className="welcome-secondary-action" onClick={() => navigate(ROUTES.approvals)}>Manager approvals <ArrowUpRight size={16} /></button>}
            {user?.role === APP_ROLES.LOB_APPROVER && <button type="button" className="welcome-secondary-action" onClick={() => navigate(ROUTES.lobApprovals)}>LOB approvals <ArrowUpRight size={16} /></button>}
            {user?.role === APP_ROLES.TRAVEL_DESK && <button type="button" className="welcome-secondary-action" onClick={() => navigate(ROUTES.travelDesk)}>Travel desk operations <ArrowUpRight size={16} /></button>}
            {(user?.role === APP_ROLES.FINANCE || isAdministrator) && <button type="button" className="welcome-secondary-action" onClick={() => navigate(ROUTES.finance)}>Finance approvals <ArrowUpRight size={16} /></button>}
          </div>
          <div className="hero-assurance"><ShieldCheck size={15} /><span>One clear place for your business travel</span><span className="assurance-separator" /><CalendarDays size={14} /><span>Plan your next journey</span></div>
        </div>
        <TravelArtwork />
        <span className="hero-plane-path" aria-hidden="true"><Plane size={19} /></span>
      </section>

      <section className="welcome-process">
        <div className="process-copy">
          <p className="process-kicker">TRAVEL REQUEST &amp; APPROVAL MANAGEMENT</p>
          <h2>A smoother journey<br />from request to booking.</h2>
          <p className="process-description">From your first request to confirmed booking, see how each part of your travel journey moves forward.</p>
          <ol className="workflow-list">{workflow.map((step, index) => <li key={step}><span className="workflow-check"><CheckCircle2 size={17} /></span><span>{step}</span><span className="workflow-number">{String(index + 1).padStart(2, '0')}</span></li>)}</ol>
          <button type="button" className="process-link" onClick={() => navigate(ROUTES.requests)}>My travel requests <ArrowRight size={15} /></button>
        </div>
        <div className="process-visual">
          <div className="process-visual-top"><span className="process-tag"><span /> YOUR TRAVEL WORKSPACE</span><span className="process-visual-spark"><Sparkles size={16} /></span></div>
          <div className="journey-path-graphic"><div className="journey-path-line" /><span className="journey-stop stop-start"><MapPinned size={17} /></span><span className="journey-stop stop-mid"><ClipboardCheck size={17} /></span><span className="journey-stop stop-end"><BriefcaseBusiness size={17} /></span><span className="journey-graphic-plane"><Plane size={35} /></span></div>
          <div className="journey-preview-card"><div className="journey-preview-icon"><Plane size={16} /></div><div><strong>Your next business journey</strong><span>Request · Approvals · Booking</span></div><span className="journey-preview-check"><Check size={15} /></span></div>
          <div className="process-visual-foot"><span>PLAN</span><i /><span>APPROVE</span><i /><span>TRAVEL</span></div>
        </div>
      </section>
    </div>
  )
}
