const DEMO_PASSWORD = 'TravelDesk123!'

export const APP_ROLES = {
  EMPLOYEE: 'employee',
  REPORTING_MANAGER: 'reportingManager',
  LOB_APPROVER: 'lobApprover',
  TRAVEL_DESK: 'travelDesk',
  FINANCE: 'finance',
  ADMIN: 'admin',
}

export const ROLE_LABELS = {
  [APP_ROLES.EMPLOYEE]: 'Employee',
  [APP_ROLES.REPORTING_MANAGER]: 'Reporting Manager',
  [APP_ROLES.LOB_APPROVER]: 'LOB Approver',
  [APP_ROLES.TRAVEL_DESK]: 'Travel Desk',
  [APP_ROLES.FINANCE]: 'Finance',
  [APP_ROLES.ADMIN]: 'Administrator',
}

export const DEMO_EMPLOYEE = {
  id: 'DEMO-EMP-01',
  name: 'Demo Traveler',
  email: 'demo@netlink.com',
  role: APP_ROLES.EMPLOYEE,
  password: DEMO_PASSWORD,
}

export const DEMO_MANAGER = {
  id: 'DEMO-RM-01',
  name: 'Demo Reporting Manager',
  email: 'manager@netlink.com',
  role: APP_ROLES.REPORTING_MANAGER,
  password: DEMO_PASSWORD,
}

export const DEMO_LOB_APPROVER = {
  id: 'DEMO-LOB-01',
  name: 'Demo LOB Approver',
  email: 'lob.approver@netlink.com',
  role: APP_ROLES.LOB_APPROVER,
  password: DEMO_PASSWORD,
}

export const DEMO_TRAVEL_DESK = {
  id: 'DEMO-TRAVEL-DESK-01',
  name: 'Demo Travel Desk',
  email: 'travel.desk@netlink.com',
  role: APP_ROLES.TRAVEL_DESK,
  password: DEMO_PASSWORD,
}

export const DEMO_FINANCE = {
  id: 'DEMO-FINANCE-01',
  name: 'Demo Finance Approver',
  email: 'finance@netlink.com',
  role: APP_ROLES.FINANCE,
  password: DEMO_PASSWORD,
}

export const DEMO_ADMIN = {
  id: 'DEMO-ADMIN-01',
  name: 'Demo Administrator',
  email: 'admin@netlink.com',
  role: APP_ROLES.ADMIN,
  password: DEMO_PASSWORD,
}

export const DEMO_ROLE_USERS = [
  DEMO_EMPLOYEE,
  DEMO_MANAGER,
  DEMO_LOB_APPROVER,
  DEMO_TRAVEL_DESK,
  DEMO_FINANCE,
  DEMO_ADMIN,
]

// Keep the employee credentials export for existing UI defaults.
export const DEMO_CREDENTIALS = {
  email: DEMO_EMPLOYEE.email,
  password: DEMO_PASSWORD,
}
