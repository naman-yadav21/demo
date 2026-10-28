import { APP_ROLES } from '../constants/demoUsers.js'
import { ROUTES } from './paths.js'

export const ROLE_SCREEN_ACCESS = {
  [APP_ROLES.EMPLOYEE]: ['home', 'newRequest', 'myRequests'],
  [APP_ROLES.REPORTING_MANAGER]: ['home', 'newRequest', 'myRequests', 'managerApprovals'],
  [APP_ROLES.LOB_APPROVER]: ['home', 'newRequest', 'myRequests', 'lobApprovals'],
  [APP_ROLES.TRAVEL_DESK]: ['home', 'newRequest', 'myRequests', 'travelDesk'],
  [APP_ROLES.FINANCE]: ['home', 'newRequest', 'myRequests', 'financeApprovals'],
  [APP_ROLES.ADMIN]: ['home', 'newRequest', 'myRequests', 'managerApprovals', 'lobApprovals', 'travelDesk', 'financeApprovals'],
}

export const ROLE_HOME_PATH = {
  [APP_ROLES.EMPLOYEE]: ROUTES.welcome,
  [APP_ROLES.REPORTING_MANAGER]: ROUTES.approvals,
  [APP_ROLES.LOB_APPROVER]: ROUTES.lobApprovals,
  [APP_ROLES.TRAVEL_DESK]: ROUTES.travelDesk,
  [APP_ROLES.FINANCE]: ROUTES.finance,
  [APP_ROLES.ADMIN]: ROUTES.welcome,
}

export function getRoleHomePath(role) {
  return ROLE_HOME_PATH[role] || ROUTES.login
}

function getScreenForPath(pathname) {
  if (pathname === ROUTES.welcome) return 'home'
  if (pathname === ROUTES.newRequest) return 'newRequest'
  if (pathname === ROUTES.requests || pathname.startsWith(`${ROUTES.requests}/`)) return 'myRequests'
  if (pathname === ROUTES.approvals || pathname.startsWith(`${ROUTES.approvals}/`)) return 'managerApprovals'
  if (pathname === ROUTES.lobApprovals || pathname.startsWith(`${ROUTES.lobApprovals}/`)) return 'lobApprovals'
  if (pathname === ROUTES.travelDesk || pathname.startsWith(`${ROUTES.travelDesk}/`)) return 'travelDesk'
  if (pathname === ROUTES.finance || pathname.startsWith(`${ROUTES.finance}/`)) return 'financeApprovals'
  return null
}

export function canAccessPath(role, pathname) {
  const screen = getScreenForPath(pathname)
  return Boolean(screen && ROLE_SCREEN_ACCESS[role]?.includes(screen))
}
