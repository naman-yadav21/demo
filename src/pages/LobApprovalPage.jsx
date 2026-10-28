import { useMemo, useState } from 'react'
import { BadgeCheck, Check, CheckCircle2, CircleX, ClipboardCheck, Clock3, Eye, MapPin, RotateCcw, Search, UserRound } from 'lucide-react'
import { ApprovalRequestDetails } from '../components/common/ApprovalRequestDetails.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'
import { DEMO_LOB_APPROVER } from '../constants/demoUsers.js'
import { getDemoRequests, updateDemoRequest } from '../utils/demoRequests.js'
import { clearDemoDraft, readDemoDraft, saveDemoDraft } from '../utils/demoDrafts.js'
import { getRequestStatusTone } from '../utils/requestStatus.js'
import { useToast } from '../context/useToast.js'

const LOB_TAB_KEY = 'traveldesk-lob-active-tab'
const lobRemarksKey = (requestId) => `traveldesk-lob-remarks:${requestId}`

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatSubmitted(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

export function LobApprovalPage() {
  const notify = useToast()
  const [requests, setRequests] = useState(() => getDemoRequests())
  const [activeTab, setActiveTab] = useState(() => readDemoDraft(LOB_TAB_KEY).activeTab || 'Pending')
  const [query, setQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [remarksError, setRemarksError] = useState('')
  const [pendingDecision, setPendingDecision] = useState('')
  const [decisionSaving, setDecisionSaving] = useState(false)
  const [clearRemarksConfirm, setClearRemarksConfirm] = useState(false)

  const assignedRequests = useMemo(() => requests.filter((request) => request.lobApproverId === DEMO_LOB_APPROVER.id && request.managerDecision === 'Approved'), [requests])
  const pendingCount = assignedRequests.filter((request) => request.status === 'Pending LOB Approval').length
  const approvedCount = assignedRequests.filter((request) => request.lobDecision === 'Approved').length
  const rejectedCount = assignedRequests.filter((request) => request.lobDecision === 'Rejected').length
  const filteredRequests = useMemo(() => assignedRequests.filter((request) => {
    const matchesTab = activeTab === 'All'
      || (activeTab === 'Pending' && request.status === 'Pending LOB Approval')
      || (activeTab === 'Approved' && request.lobDecision === 'Approved')
      || (activeTab === 'Rejected' && request.lobDecision === 'Rejected')
    const searchable = [
      request.requestId, request['employee-name'], request['employee-id'], request.department,
      request['travel-category'], request['from-location'], request['to-location'],
      request['purpose-of-travel'], request.reviewedBy, request.managerRemarks,
    ].join(' ').toLowerCase()
    return matchesTab && searchable.includes(query.trim().toLowerCase())
  }), [activeTab, assignedRequests, query])

  function closeReview() {
    setPendingDecision('')
    setClearRemarksConfirm(false)
    if (selectedRequest) clearDemoDraft(lobRemarksKey(selectedRequest.requestId))
    setSelectedRequest(null)
    setRemarks('')
    setRemarksError('')
  }

  function openReview(request) {
    setSelectedRequest(request)
    setRemarks(readDemoDraft(lobRemarksKey(request.requestId)).remarks ?? request.lobRemarks ?? '')
    setRemarksError('')
  }

  function requestDecision(decision) {
    if (!selectedRequest || decisionSaving || pendingDecision) return
    if (decision === 'Rejected' && !remarks.trim()) {
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
        status: decision === 'Approved' ? 'Pending Travel Desk' : 'Rejected by LOB',
        lobDecision: decision,
        lobReviewedBy: DEMO_LOB_APPROVER.name,
        lobReviewedAt: new Date().toISOString(),
        lobRemarks: remarks.trim(),
      })
      if (!updated) throw new Error('This travel request is no longer available.')
      clearDemoDraft(lobRemarksKey(selectedRequest.requestId))
      const nextTab = decision === 'Approved' ? 'Approved' : 'Rejected'
      setActiveTab(nextTab)
      saveDemoDraft(LOB_TAB_KEY, { activeTab: nextTab })
      setRequests(getDemoRequests())
      notify(decision === 'Approved' ? 'LOB approved the request and forwarded it to the Travel Desk.' : 'LOB rejected the request and returned it to the employee.', 'success')
      setPendingDecision('')
      closeReview()
    } catch {
      notify('The LOB decision could not be saved in this browser. Please retry.', 'error')
    } finally {
      setDecisionSaving(false)
    }
  }

  function updateRemarks(value) {
    setRemarks(value)
    setRemarksError('')
    if (selectedRequest) saveDemoDraft(lobRemarksKey(selectedRequest.requestId), { remarks: value })
  }

  function clearRemarks() {
    if (!selectedRequest || !remarks.trim()) return
    setClearRemarksConfirm(true)
  }

  function clearRemarksNow() {
    if (!selectedRequest) return
    clearDemoDraft(lobRemarksKey(selectedRequest.requestId))
    setRemarks('')
    setRemarksError('')
    setClearRemarksConfirm(false)
    notify('Unsent LOB remarks cleared.', 'success')
  }

  const tabs = [
    { label: 'Pending', count: pendingCount },
    { label: 'Approved', count: approvedCount },
    { label: 'Rejected', count: rejectedCount },
    { label: 'All', count: assignedRequests.length },
  ]

  return (
    <div className="approval-page lob-approval-page">
      <div className="approval-breadcrumb"><span>Travel Desk</span><span>/</span><span>LOB approvals</span></div>
      <header className="approval-page-heading">
        <div className="approval-heading-icon lob-heading-icon"><BadgeCheck size={21} /></div>
        <div>
          <p className="approval-eyebrow">LINE OF BUSINESS · DEMO VIEW</p>
          <h1>LOB approvals</h1>
          <p>Review requests approved by the reporting manager.</p>
        </div>
        <div className="manager-identity"><span><UserRound size={16} /></span><div><small>Assigned LOB approver</small><strong>{DEMO_LOB_APPROVER.name}</strong></div></div>
      </header>

      <section className="approval-summary" aria-label="LOB approval summary">
        <div className="approval-metric approval-metric-pending"><span><Clock3 size={17} /></span><div><small>Awaiting your review</small><strong>{pendingCount}</strong></div></div>
        <div className="approval-metric"><span><CheckCircle2 size={17} /></span><div><small>Approved by LOB</small><strong>{approvedCount}</strong></div></div>
        <div className="approval-metric"><span><CircleX size={17} /></span><div><small>Rejected by LOB</small><strong>{rejectedCount}</strong></div></div>
      </section>

      <section className="approval-list-card">
        <header className="approval-list-header"><div><h2>Requests for LOB review</h2><p>Manager-approved requests assigned to {DEMO_LOB_APPROVER.name}.</p></div><span className="approval-demo-tag"><i /> LOB QUEUE</span></header>
        <div className="approval-toolbar">
          <div className="approval-tabs" role="tablist" aria-label="Filter LOB approval requests">
            {tabs.map(({ label, count }) => <button type="button" key={label} role="tab" aria-selected={activeTab === label} className={activeTab === label ? 'active' : ''} onClick={() => { setActiveTab(label); saveDemoDraft(LOB_TAB_KEY, { activeTab: label }) }}>{label}<span>{count}</span></button>)}
          </div>
          <label className="approval-search" htmlFor="lob-approval-search"><Search size={15} /><input id="lob-approval-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee, request, destination..." /></label>
        </div>

        {filteredRequests.length ? <><div className="approval-table-scroll"><table className="approval-table lob-approval-table"><thead><tr><th>Request ID</th><th>Employee</th><th>Department</th><th>Travel category</th><th>Journey</th><th>Travel dates</th><th>RM approval</th><th>Status</th><th>Review</th></tr></thead><tbody>{filteredRequests.map((request) => <tr key={request.requestId}>
          <td className="approval-request-id">{request.requestId}</td>
          <td><strong>{request['employee-name'] || '—'}</strong><small>{request['employee-id'] || 'Employee ID unavailable'}</small></td>
          <td>{request.department || '—'}<small>{request['employee-level'] || ''}</small></td>
          <td>{request['travel-category'] || '—'}</td>
          <td><span className="approval-journey"><MapPin size={13} />{request['from-location'] || '—'} <i>→</i> {request['to-location'] || '—'}</span><small>{request['travel-type'] || 'Travel type not specified'}</small></td>
          <td>{formatDate(request['start-date'])}<small>to {formatDate(request['end-date'])} · {request.duration || 'duration unavailable'}</small></td>
          <td><span className="lob-manager-approved"><CheckCircle2 size={13} /> Approved</span><small>{request.reviewedBy || 'Reporting manager'} · {formatSubmitted(request.reviewedAt)}</small></td>
          <td><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></td>
          <td><button type="button" className="approval-review-button" onClick={() => openReview(request)}>{request.status === 'Pending LOB Approval' ? 'Review' : 'View'} <Eye size={14} aria-hidden="true" /></button></td>
        </tr>)}</tbody></table></div><div className="approval-mobile-list">{filteredRequests.map((request) => <article className="approval-mobile-card" key={`mobile-${request.requestId}`}><header><div><strong>{request.requestId}</strong><span>{request['employee-name'] || 'Employee'} · {request['employee-id'] || 'ID unavailable'}</span></div><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></header><div className="approval-mobile-route"><MapPin size={14} />{request['from-location'] || '—'} <i>→</i> {request['to-location'] || '—'}</div><div className="approval-mobile-meta"><span><small>Department / level</small>{request.department || '—'} · {request['employee-level'] || 'Level unavailable'}</span><span><small>Travel category</small>{request['travel-category'] || '—'}</span><span><small>Travel dates</small>{formatDate(request['start-date'])} – {formatDate(request['end-date'])} · {request.duration || '—'}</span><span><small>Reporting manager approval</small>{request.reviewedBy || 'Reporting manager'} · {formatSubmitted(request.reviewedAt)}</span></div><footer><button type="button" className="approval-review-button" onClick={() => openReview(request)}>{request.status === 'Pending LOB Approval' ? 'Review request' : 'View request'} <Eye size={14} aria-hidden="true" /></button></footer></article>)}</div></> : <div className="approval-empty"><span><ClipboardCheck size={23} /></span><h3>{assignedRequests.length ? 'No requests in this view' : 'No requests awaiting LOB review'}</h3><p>{assignedRequests.length ? 'Try another tab or search term.' : 'Requests will appear here after their reporting manager approves them.'}</p></div>}
        <footer className="approval-list-footer"><span>LOB decisions are saved in this browser on this device.</span><span>{filteredRequests.length} shown</span></footer>
      </section>

      <Modal open={Boolean(selectedRequest) && !pendingDecision && !clearRemarksConfirm} title={selectedRequest ? `LOB review · ${selectedRequest.requestId}` : 'LOB request review'} onClose={closeReview}>
        {selectedRequest && <>
          <div className="approval-review-summary"><span className="approval-review-avatar">{(selectedRequest['employee-name'] || 'D').slice(0, 1).toUpperCase()}</span><div><strong>{selectedRequest['employee-name'] || 'Employee'}</strong><small>{selectedRequest.requestId} · Submitted {formatSubmitted(selectedRequest.submittedAt)}</small></div><StatusBadge tone={getRequestStatusTone(selectedRequest.status)}>{selectedRequest.status}</StatusBadge></div>
          <div className="lob-manager-review"><span><CheckCircle2 size={16} /></span><div><strong>Reporting manager approval</strong><small>{selectedRequest.reviewedBy || 'Reporting manager'}{selectedRequest.reviewedAt ? ` · ${formatSubmitted(selectedRequest.reviewedAt)}` : ''}</small>{selectedRequest.managerRemarks && <p>“{selectedRequest.managerRemarks}”</p>}</div></div>
          <ApprovalRequestDetails request={selectedRequest} />
          {selectedRequest.status === 'Pending LOB Approval' ? <>
            <label className="approval-remarks-field" htmlFor="lob-remarks"><span className="approval-remarks-title">LOB decision remarks</span><span className="approval-remarks-help">Required for rejection · optional for approval</span><textarea id="lob-remarks" rows="3" maxLength="500" value={remarks} aria-invalid={Boolean(remarksError)} aria-describedby={remarksError ? 'lob-remarks-error' : undefined} onChange={(event) => updateRemarks(event.target.value)} placeholder="Add a note for the employee or explain why the request is rejected..." />{remarksError && <small id="lob-remarks-error" className="approval-remarks-error" role="alert">{remarksError}</small>}</label>
            <div className="approval-review-tools"><span>Closing this review clears unsent remarks. Your final decision is saved with this demo request.</span><button type="button" onClick={clearRemarks}><RotateCcw size={13} /> Clear remarks</button></div>
            <div className="approval-decision-actions"><button type="button" className="approval-reject-button" onClick={() => requestDecision('Rejected')}><CircleX size={16} /> Reject request</button><button type="button" className="approval-approve-button" onClick={() => requestDecision('Approved')}><Check size={16} /> Approve request</button></div>
          </> : <div className="approval-decision-note">Reviewed by {selectedRequest.lobReviewedBy || DEMO_LOB_APPROVER.name}{selectedRequest.lobReviewedAt ? ` · ${formatSubmitted(selectedRequest.lobReviewedAt)}` : ''}<span className="saved-manager-remarks"><strong>LOB remarks:</strong> {selectedRequest.lobRemarks || 'No remarks added.'}</span></div>}
        </>}
      </Modal>
      <ConfirmationDialog open={Boolean(pendingDecision)} title={pendingDecision === 'Approved' ? 'Approve this request?' : 'Reject this request?'} message={pendingDecision === 'Approved' ? 'This request will be sent to the Travel Desk for quotations.' : 'This request will be marked rejected and returned to the employee.'} confirmLabel={pendingDecision === 'Approved' ? 'Approve request' : 'Reject request'} busy={decisionSaving} onConfirm={decideRequest} onCancel={() => !decisionSaving && setPendingDecision('')} />
      <ConfirmationDialog open={clearRemarksConfirm} title="Clear unsent LOB remarks?" message="The remarks have not been submitted with a decision and will be removed from this browser." confirmLabel="Clear remarks" onConfirm={clearRemarksNow} onCancel={() => setClearRemarksConfirm(false)} />
    </div>
  )
}
