import { useMemo, useState } from 'react'
import { Check, CheckCircle2, CircleX, ClipboardCheck, ClipboardList, Clock3, Eye, MapPin, RotateCcw, Search, UserRound } from 'lucide-react'
import { Modal } from '../components/ui/Modal.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'
import { ApprovalRequestDetails } from '../components/common/ApprovalRequestDetails.jsx'
import { DEMO_MANAGER } from '../constants/demoUsers.js'
import { getDemoRequests, updateDemoRequest } from '../utils/demoRequests.js'
import { clearDemoDraft, readDemoDraft, saveDemoDraft } from '../utils/demoDrafts.js'
import { getRequestStatusTone } from '../utils/requestStatus.js'
import { useToast } from '../context/useToast.js'

const MANAGER_TAB_KEY = 'traveldesk-manager-active-tab'
const managerRemarksKey = (requestId) => `traveldesk-manager-remarks:${requestId}`

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatSubmitted(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

export function ManagerApprovalPage() {
  const notify = useToast()
  const [requests, setRequests] = useState(() => getDemoRequests())
  const [activeTab, setActiveTab] = useState(() => readDemoDraft(MANAGER_TAB_KEY).activeTab || 'Pending')
  const [query, setQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [remarksError, setRemarksError] = useState('')
  const [pendingDecision, setPendingDecision] = useState('')
  const [decisionSaving, setDecisionSaving] = useState(false)
  const [clearRemarksConfirm, setClearRemarksConfirm] = useState(false)
  const assignedRequests = useMemo(() => requests.filter((request) => request.reportingManagerId === DEMO_MANAGER.id), [requests])
  const pendingCount = assignedRequests.filter((request) => request.status === 'Pending Manager Approval').length
  const approvedCount = assignedRequests.filter((request) => request.managerDecision === 'Approved').length
  const rejectedCount = assignedRequests.filter((request) => request.managerDecision === 'Rejected').length
  const filteredRequests = useMemo(() => assignedRequests.filter((request) => {
    const matchesTab = activeTab === 'All' || (activeTab === 'Pending' && request.status === 'Pending Manager Approval') || (activeTab === 'Approved' && request.managerDecision === 'Approved') || (activeTab === 'Rejected' && request.managerDecision === 'Rejected')
    const searchable = [request.requestId, request['employee-name'], request['employee-id'], request.department, request['from-location'], request['to-location'], request['purpose-of-travel']].join(' ').toLowerCase()
    return matchesTab && searchable.includes(query.trim().toLowerCase())
  }), [activeTab, assignedRequests, query])

  function requestDecision(decision) {
    if (!selectedRequest || decisionSaving || pendingDecision) return
    if (decision === 'Rejected by Manager' && !remarks.trim()) {
      setRemarksError('Please add a reason before rejecting this request.')
      return
    }
    setPendingDecision(decision)
  }

  function decideRequest() {
    if (!selectedRequest || !pendingDecision || decisionSaving) return
    setDecisionSaving(true)
    const decision = pendingDecision
    try {
      const updated = updateDemoRequest(selectedRequest.requestId, {
        status: decision === 'Approved by Manager' ? 'Pending LOB Approval' : 'Rejected by Manager',
        managerDecision: decision === 'Approved by Manager' ? 'Approved' : 'Rejected',
        reviewedBy: DEMO_MANAGER.name,
        reviewedAt: new Date().toISOString(),
        managerRemarks: remarks.trim(),
      })
      if (!updated) throw new Error('This travel request is no longer available.')
      clearDemoDraft(managerRemarksKey(selectedRequest.requestId))
      const nextTab = decision === 'Approved by Manager' ? 'Approved' : 'Rejected'
      setActiveTab(nextTab)
      saveDemoDraft(MANAGER_TAB_KEY, { activeTab: nextTab })
      setRequests(getDemoRequests())
      notify(decision === 'Approved by Manager' ? 'Request approved and forwarded to the LOB approver.' : 'Request rejected and returned to the employee.', 'success')
      setPendingDecision('')
      closeReview()
    } catch {
      notify('The manager decision could not be saved in this browser. Please retry.', 'error')
    } finally {
      setDecisionSaving(false)
    }
  }

  function openReview(request) {
    setSelectedRequest(request)
    setRemarks(readDemoDraft(managerRemarksKey(request.requestId)).remarks ?? request.managerRemarks ?? '')
    setRemarksError('')
  }

  function updateRemarks(value) {
    setRemarks(value)
    setRemarksError('')
    if (selectedRequest) saveDemoDraft(managerRemarksKey(selectedRequest.requestId), { remarks: value })
  }

  function clearRemarks() {
    if (!selectedRequest || !remarks.trim()) return
    setClearRemarksConfirm(true)
  }

  function clearRemarksNow() {
    if (!selectedRequest) return
    clearDemoDraft(managerRemarksKey(selectedRequest.requestId))
    setRemarks('')
    setRemarksError('')
    setClearRemarksConfirm(false)
    notify('Unsent manager remarks cleared.', 'success')
  }

  function closeReview() {
    setPendingDecision('')
    setClearRemarksConfirm(false)
    if (selectedRequest) clearDemoDraft(managerRemarksKey(selectedRequest.requestId))
    setSelectedRequest(null)
    setRemarks('')
    setRemarksError('')
  }

  const tabs = [
    { label: 'Pending', count: pendingCount },
    { label: 'Approved', count: approvedCount },
    { label: 'Rejected', count: rejectedCount },
    { label: 'All', count: assignedRequests.length },
  ]

  return (
    <div className="approval-page">
      <div className="approval-breadcrumb"><span>Travel Desk</span><span>/</span><span>Manager approvals</span></div>
      <header className="approval-page-heading"><div className="approval-heading-icon"><ClipboardCheck size={21} /></div><div><p className="approval-eyebrow">REPORTING MANAGER · DEMO VIEW</p><h1>Manager approvals</h1><p>Review travel requests assigned to {DEMO_MANAGER.name}.</p></div><div className="manager-identity"><span><UserRound size={16} /></span><div><small>Assigned manager</small><strong>{DEMO_MANAGER.name}</strong></div></div></header>

      <section className="approval-summary" aria-label="Approval summary">
        <div className="approval-metric approval-metric-pending"><span><Clock3 size={17} /></span><div><small>Awaiting your review</small><strong>{pendingCount}</strong></div></div>
        <div className="approval-metric"><span><CheckCircle2 size={17} /></span><div><small>Approved</small><strong>{approvedCount}</strong></div></div>
        <div className="approval-metric"><span><CircleX size={17} /></span><div><small>Rejected</small><strong>{rejectedCount}</strong></div></div>
      </section>

      <section className="approval-list-card">
        <header className="approval-list-header"><div><h2>Requests for review</h2><p>Only requests assigned to this demo reporting manager appear here.</p></div><span className="approval-demo-tag"><i /> DEMO QUEUE</span></header>
        <div className="approval-toolbar"><div className="approval-tabs" role="tablist" aria-label="Filter approval requests">{tabs.map(({ label, count }) => <button type="button" key={label} role="tab" aria-selected={activeTab === label} className={activeTab === label ? 'active' : ''} onClick={() => { setActiveTab(label); saveDemoDraft(MANAGER_TAB_KEY, { activeTab: label }) }}>{label}<span>{count}</span></button>)}</div><label className="approval-search" htmlFor="approval-search"><Search size={15} /><input id="approval-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requests..." /></label></div>

        {filteredRequests.length ? <><div className="approval-table-scroll"><table className="approval-table"><thead><tr><th>Request ID</th><th>Employee</th><th>Department</th><th>Travel category</th><th>Journey</th><th>Travel dates</th><th>Submitted</th><th>Status</th><th>Review</th></tr></thead><tbody>{filteredRequests.map((request) => <tr key={request.requestId}><td className="approval-request-id">{request.requestId}</td><td><strong>{request['employee-name'] || '—'}</strong><small>{request['employee-id'] || 'Employee ID unavailable'}</small></td><td>{request.department || '—'}<small>{request['employee-level'] || ''}</small></td><td>{request['travel-category'] || '—'}</td><td><span className="approval-journey"><MapPin size={13} />{request['from-location'] || '—'} <i>→</i> {request['to-location'] || '—'}</span><small>{request['travel-type'] || 'Travel type not specified'}</small></td><td>{formatDate(request['start-date'])}<small>to {formatDate(request['end-date'])} · {request.duration || 'duration unavailable'}</small></td><td>{formatSubmitted(request.submittedAt)}</td><td><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></td><td><button type="button" className="approval-review-button" onClick={() => openReview(request)}>{request.status === 'Pending Manager Approval' ? 'Review' : 'View'} <Eye size={14} aria-hidden="true" /></button></td></tr>)}</tbody></table></div><div className="approval-mobile-list">{filteredRequests.map((request) => <article className="approval-mobile-card" key={`mobile-${request.requestId}`}><header><div><strong>{request.requestId}</strong><span>{request['employee-name'] || 'Employee'} · {request['employee-id'] || 'ID unavailable'}</span></div><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></header><div className="approval-mobile-route"><MapPin size={14} />{request['from-location'] || '—'} <i>→</i> {request['to-location'] || '—'}</div><div className="approval-mobile-meta"><span><small>Department</small>{request.department || '—'} · {request['employee-level'] || 'Level unavailable'}</span><span><small>Travel category</small>{request['travel-category'] || '—'}</span><span><small>Travel dates</small>{formatDate(request['start-date'])} – {formatDate(request['end-date'])} · {request.duration || '—'} days</span><span><small>Submitted</small>{formatSubmitted(request.submittedAt)}</span></div><footer><button type="button" className="approval-review-button" onClick={() => openReview(request)}>{request.status === 'Pending Manager Approval' ? 'Review request' : 'View request'} <Eye size={14} aria-hidden="true" /></button></footer></article>)}</div></> : <div className="approval-empty"><span><ClipboardList size={23} /></span><h3>{assignedRequests.length ? 'No requests in this view' : 'No requests assigned yet'}</h3><p>{assignedRequests.length ? 'Try another tab or search term.' : 'New demo travel requests assigned to this reporting manager will appear here.'}</p></div>}
        <footer className="approval-list-footer"><span>Requests and manager decisions are saved in this browser on this device.</span><span>{filteredRequests.length} shown</span></footer>
      </section>

      <Modal open={Boolean(selectedRequest) && !pendingDecision && !clearRemarksConfirm} title={selectedRequest ? `Review ${selectedRequest.requestId}` : 'Request review'} onClose={closeReview}>
        {selectedRequest && <>
          <div className="approval-review-summary"><span className="approval-review-avatar">{(selectedRequest['employee-name'] || 'D').slice(0, 1).toUpperCase()}</span><div><strong>{selectedRequest['employee-name'] || 'Employee'}</strong><small>{selectedRequest.requestId} · Submitted {formatSubmitted(selectedRequest.submittedAt)}</small></div><StatusBadge tone={getRequestStatusTone(selectedRequest.status)}>{selectedRequest.status}</StatusBadge></div>
          <ApprovalRequestDetails request={selectedRequest} />
          {selectedRequest.status === 'Pending Manager Approval' ? <><label className="approval-remarks-field" htmlFor="manager-remarks"><span className="approval-remarks-title">Decision remarks</span><span className="approval-remarks-help">Required for rejection · optional for approval</span><textarea id="manager-remarks" rows="3" maxLength="500" value={remarks} aria-invalid={Boolean(remarksError)} aria-describedby={remarksError ? 'manager-remarks-error' : undefined} onChange={(event) => updateRemarks(event.target.value)} placeholder="Add a note for the employee or explain why the request is rejected..." />{remarksError && <small id="manager-remarks-error" className="approval-remarks-error" role="alert">{remarksError}</small>}</label><div className="approval-review-tools"><span>Closing this review clears unsent remarks. Your final decision is saved with this demo request.</span><button type="button" onClick={clearRemarks}><RotateCcw size={13} /> Clear remarks</button></div><div className="approval-decision-actions"><button type="button" className="approval-reject-button" onClick={() => requestDecision('Rejected by Manager')}><CircleX size={16} /> Reject request</button><button type="button" className="approval-approve-button" onClick={() => requestDecision('Approved by Manager')}><Check size={16} /> Approve request</button></div></> : <div className="approval-decision-note">Reviewed by {selectedRequest.reviewedBy || DEMO_MANAGER.name}{selectedRequest.reviewedAt ? ` · ${formatSubmitted(selectedRequest.reviewedAt)}` : ''}<span className="saved-manager-remarks"><strong>Manager remarks:</strong> {selectedRequest.managerRemarks || 'No remarks added.'}</span></div>}
        </>}
      </Modal>
      <ConfirmationDialog open={Boolean(pendingDecision)} title={pendingDecision === 'Approved by Manager' ? 'Approve this request?' : 'Reject this request?'} message={pendingDecision === 'Approved by Manager' ? 'This demo request will be forwarded to the assigned LOB approver.' : 'This demo request will be marked rejected and returned to the employee.'} confirmLabel={pendingDecision === 'Approved by Manager' ? 'Approve request' : 'Reject request'} busy={decisionSaving} onConfirm={decideRequest} onCancel={() => !decisionSaving && setPendingDecision('')} />
      <ConfirmationDialog open={clearRemarksConfirm} title="Clear unsent manager remarks?" message="The remarks have not been submitted with a decision and will be removed from this browser." confirmLabel="Clear remarks" onConfirm={clearRemarksNow} onCancel={() => setClearRemarksConfirm(false)} />
    </div>
  )
}

