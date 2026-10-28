import { DEMO_LOB_APPROVER, DEMO_MANAGER } from '../constants/demoUsers.js'

const STORAGE_KEY = 'traveldesk-demo-requests'

function readStoredRequests() {
  try {
    const localValue = window.localStorage.getItem(STORAGE_KEY)
    if (localValue) return JSON.parse(localValue)
  } catch {
    // Fall back to the previous session-only storage format.
  }
  try {
    const sessionValue = window.sessionStorage.getItem(STORAGE_KEY)
    if (!sessionValue) return []
    const requests = JSON.parse(sessionValue)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
    return requests
  } catch {
    return []
  }
}

function writeStoredRequests(requests) {
  const serialized = JSON.stringify(requests)
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized)
  } catch {
    window.sessionStorage.setItem(STORAGE_KEY, serialized)
  }
}

export function getDemoRequests() {
  try {
    const requests = readStoredRequests()
    return Array.isArray(requests) ? requests.map((request) => {
      const storedStatus = request.status === 'Submitted' ? 'Pending Manager Approval' : request.status || 'Pending Manager Approval'
      const managerDecision = request.managerDecision || (storedStatus === 'Approved by Manager' ? 'Approved' : storedStatus === 'Rejected by Manager' ? 'Rejected' : '')
      const lobDecision = request.lobDecision || (storedStatus === 'Approved by LOB' ? 'Approved' : storedStatus === 'Rejected by LOB' ? 'Rejected' : '')
      return {
        ...request,
        status: storedStatus === 'Approved by Manager' ? 'Pending LOB Approval' : storedStatus === 'Approved by LOB' ? 'Pending Travel Desk' : storedStatus,
        managerDecision,
        lobDecision,
        reportingManager: request.reportingManager || DEMO_MANAGER.name,
        reportingManagerId: request.reportingManagerId || DEMO_MANAGER.id,
        lobApprover: request.lobApprover || DEMO_LOB_APPROVER.name,
        lobApproverId: request.lobApproverId || DEMO_LOB_APPROVER.id,
        'purpose-of-travel': request['purpose-of-travel'] || request['travel-reason'] || '',
      }
    }) : []
  } catch {
    return []
  }
}

export function saveDemoRequest(formValues) {
  const requests = getDemoRequests()
  const request = {
    ...formValues,
    requestId: `REQ-${Date.now().toString().slice(-7)}`,
    status: 'Pending Manager Approval',
    reportingManager: formValues['reporting-manager'] || 'Demo Reporting Manager',
    reportingManagerId: DEMO_MANAGER.id,
    lobApprover: DEMO_LOB_APPROVER.name,
    lobApproverId: DEMO_LOB_APPROVER.id,
    submittedAt: new Date().toISOString(),
  }
  writeStoredRequests([request, ...requests])
  return request
}

export function updateDemoRequest(requestId, updates) {
  const requests = getDemoRequests()
  const updatedRequests = requests.map((request) => request.requestId === requestId ? { ...request, ...updates } : request)
  writeStoredRequests(updatedRequests)
  return updatedRequests.find((request) => request.requestId === requestId) ?? null
}
