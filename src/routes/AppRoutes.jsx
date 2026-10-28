import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { WelcomePage } from '../pages/WelcomePage.jsx'
import { TravelRequestPage } from '../pages/TravelRequestPage.jsx'
import { RequestStatusPage } from '../pages/RequestStatusPage.jsx'
import { ManagerApprovalPage } from '../pages/ManagerApprovalPage.jsx'
import { LobApprovalPage } from '../pages/LobApprovalPage.jsx'
import { TravelDeskPage } from '../pages/TravelDeskPage.jsx'
import { FinancePage } from '../pages/FinancePage.jsx'
import { TravelBookingPage } from '../pages/TravelBookingPage.jsx'
import { PlaceholderPage } from '../pages/PlaceholderPage.jsx'
import { useDemoAuth } from '../context/DemoAuthContext.jsx'
import { ROUTES } from './paths.js'
import { canAccessPath, getRoleHomePath } from './roleAccess.js'

function RequireDemoAuth() {
  const { isAuthenticated } = useDemoAuth()
  const location = useLocation()
  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.login} state={{ from: location }} replace />
}

function RequireRole() {
  const { user } = useDemoAuth()
  const location = useLocation()
  return canAccessPath(user?.role, location.pathname)
    ? <Outlet />
    : <Navigate to={getRoleHomePath(user?.role)} replace />
}

function RoleHomeRedirect() {
  const { user } = useDemoAuth()
  return <Navigate to={getRoleHomePath(user?.role)} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route element={<RequireDemoAuth />}>
        <Route element={<AppLayout />}>
        <Route index element={<RoleHomeRedirect />} />
        <Route path={ROUTES.dashboard} element={<RoleHomeRedirect />} />
        <Route path={ROUTES.reports} element={<RoleHomeRedirect />} />
        <Route path={ROUTES.settings} element={<RoleHomeRedirect />} />
        <Route element={<RequireRole />}>
          <Route path={ROUTES.welcome} element={<WelcomePage />} />
          <Route path={ROUTES.newRequest} element={<TravelRequestPage />} />
          <Route path={ROUTES.requests} element={<RequestStatusPage />} />
          <Route path={ROUTES.approvals} element={<ManagerApprovalPage />} />
          <Route path={ROUTES.lobApprovals} element={<LobApprovalPage />} />
          <Route path={ROUTES.travelDeskRequest} element={<TravelDeskPage />} />
          <Route path={ROUTES.travelDeskBooking} element={<TravelBookingPage />} />
          <Route path={ROUTES.travelDesk} element={<TravelDeskPage />} />
          <Route path={ROUTES.finance} element={<FinancePage />} />
        </Route>
        </Route>
      </Route>
      <Route path="*" element={<PlaceholderPage title="Page not found" standalone />} />
    </Routes>
  )
}
