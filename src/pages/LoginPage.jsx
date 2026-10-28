import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDemoAuth } from '../context/DemoAuthContext.jsx'
import { DEMO_CREDENTIALS, DEMO_ROLE_USERS, ROLE_LABELS } from '../constants/demoUsers.js'
import { useToast } from '../context/useToast.js'
import { ROUTES } from '../routes/paths.js'
import { canAccessPath, getRoleHomePath } from '../routes/roleAccess.js'
import { ArrowRight, BarChart3, Eye, EyeOff, FileText, Globe2, LockKeyhole, Mail, MapPin, Plane, ShieldCheck } from 'lucide-react'
import { NetlinkLogo } from '../components/common/NetlinkLogo.jsx'

const featureCards = [
  {
    icon: Plane,
    colorClass: 'icon-blue',
    title: 'Plan Travel',
    text: 'Flights, Hotels & More',
  },
  {
    icon: FileText,
    colorClass: 'icon-green',
    title: 'Get Approvals',
    text: 'Automated Workflows',
  },
  {
    icon: BarChart3,
    colorClass: 'icon-purple',
    title: 'Track Expenses',
    text: 'Stay Within Policy',
  },
]

function Brand() {
  return (
    <div className="login-brand" aria-label="Netlink Travel Desk">
      <NetlinkLogo size={28} variant="icon" />
      <span className="login-brand-name">Netlink</span>
      <span className="brand-divider" />
      <span className="login-brand-product">Travel Desk</span>
    </div>
  )
}

function FloatingFeatures() {
  return (
    <div className="floating-features-container" aria-hidden="true">
      <div className="feature-cards-stack">
        {featureCards.map(({ icon: Icon, colorClass, title, text }) => (
          <div className="feature-glass-card" key={title}>
            <span className={`feature-badge-icon ${colorClass}`}>
              <Icon size={17} strokeWidth={2.2} />
            </span>
            <div className="feature-badge-copy">
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="route-trajectory">
        <svg className="route-curve-svg" viewBox="0 0 160 80" fill="none">
          <path d="M 5 40 Q 60 10 135 25" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="4 4" opacity="0.85" />
        </svg>
        <div className="destination-pin">
          <MapPin size={12} strokeWidth={2.4} />
        </div>
      </div>
    </div>
  )
}

function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useDemoAuth()
  const notify = useToast()
  const [selectedAccountId, setSelectedAccountId] = useState(DEMO_ROLE_USERS[0].id)
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email)
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')

  function submit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = login(formData.get('email'), formData.get('password'))
    if (!result.success) {
      setMessageType('error')
      setMessage(result.reason === 'storage'
        ? 'This browser could not save your demo session. Please enable site storage and try again.'
        : 'The email or password is incorrect. Use the demo credentials shown below.')
      notify(result.reason === 'storage' ? 'Demo sign-in failed because browser storage is unavailable.' : 'Email or password is incorrect. Check the demo credentials and try again.', 'error')
      return
    }
    notify(`Signed in as ${ROLE_LABELS[result.user.role]}.`, 'success')
    const requestedPath = location.state?.from?.pathname
    const destination = requestedPath && canAccessPath(result.user.role, requestedPath)
      ? requestedPath
      : getRoleHomePath(result.user.role)
    navigate(destination, { replace: true })
  }

  function selectDemoRole(event) {
    const account = DEMO_ROLE_USERS.find((candidate) => candidate.id === event.target.value)
    if (!account) return
    setSelectedAccountId(account.id)
    setEmail(account.email)
    setPassword(account.password)
    setMessage('')
  }

  function showDemoMessage(text) {
    setMessageType('info')
    setMessage(text)
    notify(text, 'info')
  }

  return (
    <div className="login-card">
      <div className="card-brand">
        <NetlinkLogo size={22} variant="icon" />
        <span className="card-brand-name">Netlink</span>
        <span className="card-brand-divider">|</span>
        <span className="card-brand-product">Travel Desk</span>
      </div>
      <h2>Welcome back</h2>
      <p className="card-intro">Sign in to your Travel Desk account to continue.</p>
      <form onSubmit={submit}>
        <label className="login-label" htmlFor="demo-role">DEMO ROLE</label>
        <select id="demo-role" className="login-role-select" value={selectedAccountId} onChange={selectDemoRole}>
          {DEMO_ROLE_USERS.map((account) => (
            <option key={account.id} value={account.id}>{ROLE_LABELS[account.role]}</option>
          ))}
        </select>
        <label className="login-label" htmlFor="work-email">WORK EMAIL</label>
        <div className="login-input-wrap">
          <Mail size={15} />
          <input
            id="work-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            aria-label="Work email"
          />
        </div>
        <div className="password-label-row">
          <label className="login-label" htmlFor="work-password">PASSWORD</label>
          <button type="button" className="text-link" onClick={() => showDemoMessage('Contact your administrator to reset your password.')}>
            Forgot password?
          </button>
        </div>
        <div className="login-input-wrap">
          <LockKeyhole size={15} />
          <input
            id="work-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            aria-label="Password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {message && <p className={`login-message message-${messageType}`} role="status">{message}</p>}
        <button type="submit" className="sign-in-button">
          Sign in <ArrowRight size={15} />
        </button>
      </form>
      <p className="demo-credentials">Demo password for all roles: {DEMO_CREDENTIALS.password}</p>
      <div className="or-divider"><span>or continue with</span></div>
      <button type="button" className="microsoft-button" onClick={() => showDemoMessage('Microsoft sign-in is not connected in this demo.')}>
        <span className="ms-logo" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        Sign in with Microsoft
      </button>
      <p className="support-line">
        Need help signing in? <button type="button" className="text-link" onClick={() => showDemoMessage('Please contact your Travel Desk administrator for support.')}>Contact IT support</button>
      </p>
    </div>
  )
}

export function LoginPage() {
  const { isAuthenticated, user } = useDemoAuth()
  if (isAuthenticated) return <Navigate to={getRoleHomePath(user?.role)} replace />

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Travel Desk overview">
        <Brand />
        <div className="visual-copy">
          <div className="visual-eyebrow">
            <span className="eyebrow-dot" /> NETLINK TRAVEL DESK MANAGEMENT
          </div>
          <h1>
            Your Business<br />Journey Starts Here
          </h1>
          <p>
            Manage employee travel, approvals, bookings, and expenses through one seamless experience.
          </p>
        </div>
        <FloatingFeatures />
        <div className="visual-footer">
          TRAVEL SMARTER <span>•</span> WORK BETTER <span>•</span> GROW TOGETHER
        </div>
      </section>
      <section className="login-panel">
        <header className="login-topbar">
          <div>
            <ShieldCheck size={14} className="topbar-icon" />
            <span>Secure · Enterprise Sign In</span>
          </div>
          <span className="portal-link">
            <Globe2 size={14} className="topbar-icon" /> Employee portal
          </span>
        </header>
        <div className="login-panel-center">
          <LoginForm />
        </div>
        <footer className="login-footer">
          <span>© 2026 Netlink Corporation. All rights reserved.</span>
          <nav aria-label="Legal links">
            <a href="#privacy">Privacy</a>
            <i /> <a href="#terms">Terms</a>
            <i /> <a href="#travel-desk">Travel Desk Management</a>
          </nav>
        </footer>
      </section>
    </main>
  )
}
