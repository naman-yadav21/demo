import { useEffect, useMemo, useState } from 'react'
import { BadgeDollarSign, CarFront, Check, CheckCircle2, CircleX, Clock3, Download, Eye, FileText, Hotel, MapPin, Plane, RotateCcw, Search, UserRound, WalletCards } from 'lucide-react'
import { ApprovalRequestDetails } from '../components/common/ApprovalRequestDetails.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'
import { DEMO_FINANCE } from '../constants/demoUsers.js'
import { useToast } from '../context/useToast.js'
import { getDemoRequests, updateDemoRequest } from '../utils/demoRequests.js'
import { clearDemoDraft, readDemoDraft, saveDemoDraft } from '../utils/demoDrafts.js'
import { downloadDemoAttachment, getDemoAttachment } from '../utils/demoAttachments.js'
import { getRequestStatusTone } from '../utils/requestStatus.js'

const FINANCE_TAB_KEY = 'traveldesk-finance-active-tab'
const financeRemarksKey = (requestId) => `traveldesk-finance-remarks:${requestId}`
const pendingFinanceStatuses = ['Pending Finance Approval', 'Quotation Selected']

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatTimestamp(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

function formatAmount(value, currency = 'INR') {
  if (value == null || value === '') return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value))
}

function SelectedQuoteSummary({ request }) {
  const travelIndex = request.selectedQuoteOptions?.travel
  const hotelIndex = request.selectedQuoteOptions?.hotel
  const travel = request.travelDeskQuotes?.travelQuotes?.[travelIndex]
  const hotel = request.travelDeskQuotes?.hotelQuotes?.[hotelIndex]
  return <div className="finance-selected-summary"><div><span><Plane size={14} /> Employee selected · travel</span><strong>{travel ? `${travel.mode || 'Travel'} · ${travel.vendor || 'Vendor'}` : 'No travel quotation selected'}</strong>{travel && <b>{formatAmount(travel.amount, travel.currency)}</b>}</div><div><span><Hotel size={14} /> Employee selected · stay</span><strong>{hotel ? `${hotel.hotelName || 'Hotel'} · ${hotel.roomPlan || 'Stay plan'}` : 'No hotel quotation selected'}</strong>{hotel && <b>{formatAmount(hotel.amount, hotel.currency)}</b>}</div></div>
}

function FinanceQuoteGroup({ request, kind, title, options, selectedIndex, rejectedIndexes, onView, onDownload }) {
  const isTravel = kind === 'travel'
  if (!options?.length) return <section className="finance-review-section"><header><span>{isTravel ? <Plane size={16} /> : <Hotel size={16} />}</span><div><h3>{title}</h3><p>No quotations were submitted for this service.</p></div></header></section>

  return <section className="finance-review-section"><header><span>{isTravel ? <Plane size={16} /> : <Hotel size={16} />}</span><div><h3>{title}</h3><p>Compare all options and confirm the one selected by the employee.</p></div></header><div className="finance-options-grid">{options.map((option, index) => {
    const attachmentField = `${kind}-quote-${index + 1}-attachment`
    const isSelected = selectedIndex === index
    const wasRejected = rejectedIndexes?.includes(index)
    return <article className={`finance-option-card${isSelected ? ' is-selected' : ''}${wasRejected ? ' is-rejected' : ''}`} key={`${kind}-${index}`}>
      <div className="finance-option-top"><span className="finance-option-number">OPTION 0{index + 1}</span>{isSelected ? <span className="finance-option-tag selected"><CheckCircle2 size={12} /> Employee selected</span> : wasRejected ? <span className="finance-option-tag rejected"><CircleX size={12} /> Previously rejected</span> : null}</div>
      <h4>{isTravel ? option.mode || 'Travel option' : option.hotelName || 'Hotel option'}</h4>
      <p>{isTravel ? `Airline / vendor: ${option.vendor || 'Not specified'}` : `Room / plan: ${option.roomPlan || 'Not specified'}`}</p>
      <div className="finance-option-price"><small>Quoted amount</small><strong>{formatAmount(option.amount, option.currency || 'INR')}</strong>{option.currency === 'USD' && option.amountInr != null && <span>Approx. {formatAmount(option.amountInr, 'INR')} · rate {option.exchangeRateDate || 'date unavailable'}</span>}</div>
      <div className="finance-option-file">{option.attachmentName ? <><span><FileText size={13} />{option.attachmentName}</span><div><button type="button" onClick={() => onView(request.requestId, attachmentField)}><Eye size={13} /> View</button><button type="button" onClick={() => onDownload(request.requestId, attachmentField)}><Download size={13} /> Download</button></div></> : <span className="no-finance-file">No quotation file attached</span>}</div>
    </article>
  })}</div></section>
}

export function FinancePage() {
  const notify = useToast()
  const [requests, setRequests] = useState(() => getDemoRequests())
  const [activeTab, setActiveTab] = useState(() => readDemoDraft(FINANCE_TAB_KEY).activeTab || 'Pending')
  const [query, setQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [remarksError, setRemarksError] = useState('')
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [pendingDecision, setPendingDecision] = useState('')
  const [decisionSaving, setDecisionSaving] = useState(false)
  const [clearRemarksConfirm, setClearRemarksConfirm] = useState(false)

  useEffect(() => {
    if (!previewAttachment?.url) return undefined
    return () => URL.revokeObjectURL(previewAttachment.url)
  }, [previewAttachment])

  const financeRequests = useMemo(() => requests.filter((request) => [...pendingFinanceStatuses, 'Finance Approved', 'Rejected by Finance', 'Booking Confirmed'].includes(request.status)), [requests])
  const pendingCount = financeRequests.filter((request) => pendingFinanceStatuses.includes(request.status)).length
  const approvedCount = financeRequests.filter((request) => request.status === 'Finance Approved').length
  const rejectedCount = financeRequests.filter((request) => request.status === 'Rejected by Finance').length
  const bookedCount = financeRequests.filter((request) => request.status === 'Booking Confirmed').length
  const filteredRequests = useMemo(() => financeRequests.filter((request) => {
    const matchesTab = activeTab === 'All'
      || (activeTab === 'Pending' && pendingFinanceStatuses.includes(request.status))
      || (activeTab === 'Approved' && request.status === 'Finance Approved')
      || (activeTab === 'Rejected' && request.status === 'Rejected by Finance')
      || (activeTab === 'Booked' && request.status === 'Booking Confirmed')
    const searchable = [request.requestId, request['employee-name'], request['employee-id'], request.department, request['from-location'], request['to-location'], request['travel-category'], request.financeRemarks].join(' ').toLowerCase()
    return matchesTab && searchable.includes(query.trim().toLowerCase())
  }), [activeTab, financeRequests, query])

  const isPending = selectedRequest && pendingFinanceStatuses.includes(selectedRequest.status)

  function closeReview() {
    setPendingDecision('')
    setClearRemarksConfirm(false)
    if (selectedRequest) clearDemoDraft(financeRemarksKey(selectedRequest.requestId))
    setSelectedRequest(null)
    setPreviewAttachment(null)
    setRemarks('')
    setRemarksError('')
  }

  function openReview(request) {
    setSelectedRequest(request)
    setPreviewAttachment(null)
    setRemarks(readDemoDraft(financeRemarksKey(request.requestId)).remarks ?? '')
    setRemarksError('')
  }

  function updateRemarks(value) {
    setRemarks(value)
    setRemarksError('')
    if (selectedRequest) saveDemoDraft(financeRemarksKey(selectedRequest.requestId), { remarks: value })
  }

  function clearRemarks() {
    if (!selectedRequest || !remarks.trim()) return
    setClearRemarksConfirm(true)
  }

  function clearRemarksNow() {
    if (!selectedRequest) return
    clearDemoDraft(financeRemarksKey(selectedRequest.requestId))
    setRemarks('')
    setRemarksError('')
    setClearRemarksConfirm(false)
    notify('Unsent Finance remarks cleared.', 'success')
  }

  function viewAttachment(requestId, fieldName) {
    getDemoAttachment(requestId, fieldName).then((attachment) => {
      if (!attachment) {
        notify('This quotation file is no longer available in browser storage.', 'error')
        return
      }
      setPreviewAttachment({ ...attachment, url: URL.createObjectURL(attachment.file) })
    }).catch(() => notify('The quotation file could not be previewed.', 'error'))
  }

  function downloadAttachment(requestId, fieldName) {
    downloadDemoAttachment(requestId, fieldName).then((downloaded) => {
      if (!downloaded) notify('This quotation file is no longer available in browser storage.', 'error')
    }).catch(() => notify('The quotation file could not be downloaded.', 'error'))
  }

  function requestDecision(decision) {
    if (!selectedRequest || decisionSaving || pendingDecision) return
    if (decision === 'Rejected' && !remarks.trim()) {
      setRemarksError('Please add a reason before returning this request to the employee.')
      return
    }
    setPendingDecision(decision)
  }

  function decideRequest() {
    if (!selectedRequest || !pendingDecision || decisionSaving) return
    setDecisionSaving(true)
    const decision = pendingDecision
    const now = new Date().toISOString()
    const priorRejected = selectedRequest.financeRejectedSelections || { travel: [], hotel: [] }
    const selected = selectedRequest.selectedQuoteOptions || { travel: null, hotel: null }
    const rejectedSelections = decision === 'Rejected' ? {
      travel: [...new Set([...(priorRejected.travel || []), ...(selected.travel == null ? [] : [selected.travel])])],
      hotel: [...new Set([...(priorRejected.hotel || []), ...(selected.hotel == null ? [] : [selected.hotel])])],
    } : priorRejected
    const review = { decision, reviewer: DEMO_FINANCE.name, reviewedAt: now, remarks: remarks.trim(), selectedQuoteOptions: selected }

    try {
      const updated = updateDemoRequest(selectedRequest.requestId, {
        status: decision === 'Approved' ? 'Finance Approved' : 'Rejected by Finance',
        financeDecision: decision,
        financeReviewedBy: DEMO_FINANCE.name,
        financeReviewedAt: now,
        financeRemarks: remarks.trim(),
        financeRejectedSelections: rejectedSelections,
        financeReviewHistory: [...(selectedRequest.financeReviewHistory || []), review],
      })
      if (!updated) throw new Error('This travel request is no longer available.')
      clearDemoDraft(financeRemarksKey(selectedRequest.requestId))
      if (decision === 'Rejected') clearDemoDraft(`traveldesk-quote-selection:${selectedRequest.requestId}`)
      const nextTab = decision === 'Approved' ? 'Approved' : 'Rejected'
      setActiveTab(nextTab)
      saveDemoDraft(FINANCE_TAB_KEY, { activeTab: nextTab })
      setRequests(getDemoRequests())
      notify(decision === 'Approved' ? 'Finance approved the request and forwarded it to the Travel Desk.' : 'Request returned to the employee. The rejected option is blocked from re-selection.', 'success')
      setPendingDecision('')
      closeReview()
    } catch {
      notify('The Finance decision could not be saved in this browser. Please retry.', 'error')
    } finally {
      setDecisionSaving(false)
    }
  }

  const tabs = [
    { label: 'Pending', count: pendingCount },
    { label: 'Approved', count: approvedCount },
    { label: 'Rejected', count: rejectedCount },
    { label: 'Booked', count: bookedCount },
    { label: 'All', count: financeRequests.length },
  ]

  const imagePreview = previewAttachment?.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(previewAttachment?.name || '')
  const pdfPreview = previewAttachment?.type === 'application/pdf' || /\.pdf$/i.test(previewAttachment?.name || '')

  return (
    <div className="approval-page finance-page">
      <div className="approval-breadcrumb"><span>Travel Desk</span><span>/</span><span>Finance review</span></div>
      <header className="approval-page-heading">
        <div className="approval-heading-icon finance-heading-icon"><BadgeDollarSign size={21} /></div>
        <div><p className="approval-eyebrow">FINANCE · QUOTATION APPROVAL</p><h1>Finance approvals</h1><p>Review the travel request, employee-selected quotations and cost before deciding.</p></div>
        <div className="manager-identity"><span><UserRound size={16} /></span><div><small>Assigned finance reviewer</small><strong>{DEMO_FINANCE.name}</strong></div></div>
      </header>

      <section className="approval-summary" aria-label="Finance approval summary">
        <div className="approval-metric approval-metric-pending"><span><Clock3 size={17} /></span><div><small>Awaiting your review</small><strong>{pendingCount}</strong></div></div>
        <div className="approval-metric"><span><CheckCircle2 size={17} /></span><div><small>Finance approved</small><strong>{approvedCount}</strong></div></div>
        <div className="approval-metric"><span><CircleX size={17} /></span><div><small>Returned to employee</small><strong>{rejectedCount}</strong></div></div>
        <div className="approval-metric"><span><Plane size={17} /></span><div><small>Bookings completed</small><strong>{bookedCount}</strong></div></div>
      </section>

      <section className="approval-list-card">
        <header className="approval-list-header"><div><h2>Requests for Finance</h2><p>Review quotations submitted by employees and track completed Travel Desk bookings.</p></div><span className="approval-demo-tag"><i /> FINANCE QUEUE</span></header>
        <div className="approval-toolbar">
          <div className="approval-tabs" role="tablist" aria-label="Filter Finance requests">{tabs.map(({ label, count }) => <button type="button" key={label} role="tab" aria-selected={activeTab === label} className={activeTab === label ? 'active' : ''} onClick={() => { setActiveTab(label); saveDemoDraft(FINANCE_TAB_KEY, { activeTab: label }) }}>{label}<span>{count}</span></button>)}</div>
          <label className="approval-search" htmlFor="finance-search"><Search size={15} /><input id="finance-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee, request, destination..." /></label>
        </div>
        {filteredRequests.length ? <><div className="approval-table-scroll"><table className="approval-table finance-table"><thead><tr><th>Request ID</th><th>Employee</th><th>Journey</th><th>Travel dates</th><th>Employee-selected options</th><th>Status</th><th>Review</th></tr></thead><tbody>{filteredRequests.map((request) => {
          const travel = request.travelDeskQuotes?.travelQuotes?.[request.selectedQuoteOptions?.travel]
          const hotel = request.travelDeskQuotes?.hotelQuotes?.[request.selectedQuoteOptions?.hotel]
          const pending = pendingFinanceStatuses.includes(request.status)
          return <tr key={request.requestId}><td className="approval-request-id">{request.requestId}</td><td><strong>{request['employee-name'] || '—'}</strong><small>{request['employee-id'] || 'Employee ID unavailable'} · {request.department || 'Department unavailable'}</small></td><td><span className="approval-journey"><MapPin size={13} />{request['from-location'] || '—'} <i>→</i> {request['to-location'] || '—'}</span><small>{request['travel-category'] || request['travel-type'] || 'Business trip'}</small></td><td>{formatDate(request['start-date'])}<small>to {formatDate(request['end-date'])} · {request.duration || '—'} days</small></td><td><strong>{travel ? `${travel.mode || 'Travel'} · ${travel.vendor || 'Vendor'}` : 'Travel not selected'}</strong><small>{travel ? formatAmount(travel.amount, travel.currency) : ''}</small><strong>{hotel ? `${hotel.hotelName || 'Hotel'} · ${hotel.roomPlan || 'Stay'}` : 'Stay not selected'}</strong><small>{hotel ? formatAmount(hotel.amount, hotel.currency) : ''}</small></td><td><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></td><td><button type="button" className="approval-review-button" onClick={() => openReview(request)}>{pending ? 'Review' : 'View'} <Eye size={14} aria-hidden="true" /></button></td></tr>
        })}</tbody></table></div><div className="approval-mobile-list">{filteredRequests.map((request) => { const travel = request.travelDeskQuotes?.travelQuotes?.[request.selectedQuoteOptions?.travel]; const hotel = request.travelDeskQuotes?.hotelQuotes?.[request.selectedQuoteOptions?.hotel]; const pending = pendingFinanceStatuses.includes(request.status); return <article className="approval-mobile-card" key={`mobile-${request.requestId}`}><header><div><strong>{request.requestId}</strong><span>{request['employee-name'] || 'Employee'} · {request['employee-id'] || 'ID unavailable'}</span></div><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></header><div className="approval-mobile-route"><MapPin size={14} />{request['from-location'] || '—'} <i>→</i> {request['to-location'] || '—'}</div><div className="approval-mobile-meta"><span><small>Department / category</small>{request.department || '—'} · {request['travel-category'] || request['travel-type'] || 'Business trip'}</span><span><small>Travel dates</small>{formatDate(request['start-date'])} – {formatDate(request['end-date'])} · {request.duration || '—'} days</span></div><div className="finance-mobile-options"><div><small>Selected travel</small><strong>{travel ? `${travel.mode || 'Travel'} · ${travel.vendor || 'Vendor'}` : 'Travel not selected'}</strong><span>{travel ? formatAmount(travel.amount, travel.currency) : '—'}</span></div><div><small>Selected stay</small><strong>{hotel ? `${hotel.hotelName || 'Hotel'} · ${hotel.roomPlan || 'Stay'}` : 'Stay not selected'}</strong><span>{hotel ? formatAmount(hotel.amount, hotel.currency) : '—'}</span></div></div><footer><button type="button" className="approval-review-button" onClick={() => openReview(request)}>{pending ? 'Review request' : 'View request'} <Eye size={14} aria-hidden="true" /></button></footer></article>})}</div></> : <div className="approval-empty"><span><WalletCards size={23} /></span><h3>{financeRequests.length ? 'No requests in this view' : 'No requests for Finance yet'}</h3><p>{financeRequests.length ? 'Try another tab or search term.' : 'An employee-selected quotation will appear here after submission.'}</p></div>}
        <footer className="approval-list-footer"><span>Finance decisions and remarks are saved in this browser on this device.</span><span>{filteredRequests.length} shown</span></footer>
      </section>

      <Modal open={Boolean(selectedRequest) && !pendingDecision && !clearRemarksConfirm} title={selectedRequest ? `Finance review · ${selectedRequest.requestId}` : 'Finance review'} onClose={closeReview} className="modal-finance-review">
        {selectedRequest && <div className="finance-review-content">
          <div className="approval-review-summary"><span className="approval-review-avatar"><UserRound size={16} /></span><div><strong>{selectedRequest['employee-name'] || 'Employee'} · {selectedRequest['employee-id'] || 'ID unavailable'}</strong><small>{selectedRequest.requestId} · Submitted {formatTimestamp(selectedRequest.submittedAt)}</small></div><StatusBadge tone={getRequestStatusTone(selectedRequest.status)}>{selectedRequest.status}</StatusBadge></div>
          <section className="finance-review-section"><header><span><FileText size={16} /></span><div><h3>Travel request details</h3><p>Employee, journey and approval information for this trip.</p></div></header><ApprovalRequestDetails request={selectedRequest} /><div className="finance-context-line"><span>Travel type</span><strong>{selectedRequest['travel-type'] || '—'}</strong><span>Bill / Unbill</span><strong>{selectedRequest['billing-type'] || '—'}</strong><span>Manager</span><strong>{selectedRequest.reportingManager || '—'}</strong></div>{selectedRequest.managerRemarks && <p className="finance-approval-remark"><strong>Manager remarks:</strong> {selectedRequest.managerRemarks}</p>}{selectedRequest.lobRemarks && <p className="finance-approval-remark"><strong>LOB remarks:</strong> {selectedRequest.lobRemarks}</p>}</section>
          <div className="finance-section-label"><span><WalletCards size={15} /></span><div><strong>Employee selection</strong><small>These are the options the employee chose from the Travel Desk quotations.</small></div></div>
          <SelectedQuoteSummary request={selectedRequest} />
          {selectedRequest.travelDeskQuotes?.cabEstimate && <section className="finance-cab-estimate"><div><CarFront size={15} /><span><small>Cab / taxi estimate</small><strong>{selectedRequest.travelDeskQuotes.cabEstimate.vendor || selectedRequest.travelDeskQuotes.cabEstimate.type || 'Ground transport'}</strong></span></div><span>{selectedRequest.travelDeskQuotes.cabEstimate.days || '—'} days</span><strong>{formatAmount(selectedRequest.travelDeskQuotes.cabEstimate.totalAmount, selectedRequest.travelDeskQuotes.cabEstimate.currency || 'INR')}</strong></section>}
          {previewAttachment && <section className="request-attachment-preview finance-attachment-preview" aria-label={`Preview ${previewAttachment.name}`}><header><div><Eye size={14} /><strong>{previewAttachment.name}</strong></div><button type="button" onClick={() => setPreviewAttachment(null)} aria-label="Close attachment preview"><CircleX size={16} /></button></header>{imagePreview ? <img src={previewAttachment.url} alt={`Preview of ${previewAttachment.name}`} /> : pdfPreview ? <iframe src={previewAttachment.url} title={`Preview of ${previewAttachment.name}`} /> : <div className="request-attachment-preview-fallback"><FileText size={24} /><strong>Preview isn’t available for this file type.</strong><span>Download the quotation to open it on your device.</span></div>}</section>}
          <FinanceQuoteGroup request={selectedRequest} kind="travel" title="All travel quotations" options={selectedRequest.travelDeskQuotes?.travelQuotes} selectedIndex={selectedRequest.selectedQuoteOptions?.travel} rejectedIndexes={selectedRequest.financeRejectedSelections?.travel} onView={viewAttachment} onDownload={downloadAttachment} />
          <FinanceQuoteGroup request={selectedRequest} kind="hotel" title="All hotel quotations" options={selectedRequest.travelDeskQuotes?.hotelQuotes} selectedIndex={selectedRequest.selectedQuoteOptions?.hotel} rejectedIndexes={selectedRequest.financeRejectedSelections?.hotel} onView={viewAttachment} onDownload={downloadAttachment} />

          {isPending ? <><label className="approval-remarks-field" htmlFor="finance-remarks"><span className="approval-remarks-title">Finance decision remarks</span><span className="approval-remarks-help">Required when returning a request · optional when approving</span><textarea id="finance-remarks" rows="3" maxLength="500" value={remarks} aria-invalid={Boolean(remarksError)} aria-describedby={remarksError ? 'finance-remarks-error' : undefined} onChange={(event) => updateRemarks(event.target.value)} placeholder="Add a finance note or explain what needs to change..." />{remarksError && <small id="finance-remarks-error" className="approval-remarks-error" role="alert">{remarksError}</small>}</label><div className="approval-review-tools"><span>Closing this review clears unsent remarks. A rejection returns the request to the employee.</span><button type="button" onClick={clearRemarks}><RotateCcw size={13} /> Clear remarks</button></div><div className="approval-decision-actions"><button type="button" className="approval-reject-button" onClick={() => requestDecision('Rejected')}><CircleX size={16} /> Return for new selection</button><button type="button" className="approval-approve-button" onClick={() => requestDecision('Approved')}><Check size={16} /> Approve request</button></div></> : <div className="approval-decision-note">Reviewed by {selectedRequest.financeReviewedBy || DEMO_FINANCE.name}{selectedRequest.financeReviewedAt ? ` · ${formatTimestamp(selectedRequest.financeReviewedAt)}` : ''}<span className="saved-manager-remarks"><strong>Finance remarks:</strong> {selectedRequest.financeRemarks || 'No remarks added.'}</span></div>}
        </div>}
      </Modal>
      <ConfirmationDialog open={Boolean(pendingDecision)} title={pendingDecision === 'Approved' ? 'Approve this request?' : 'Return this request?'} message={pendingDecision === 'Approved' ? 'Finance approval will send this request to the Travel Desk for booking.' : 'The employee will need to choose quotations again. The option selected for this review will be blocked.'} confirmLabel={pendingDecision === 'Approved' ? 'Approve request' : 'Return to employee'} busy={decisionSaving} onConfirm={decideRequest} onCancel={() => !decisionSaving && setPendingDecision('')} />
      <ConfirmationDialog open={clearRemarksConfirm} title="Clear unsent Finance remarks?" message="These remarks have not been submitted with a Finance decision and will be removed from this browser." confirmLabel="Clear remarks" onConfirm={clearRemarksNow} onCancel={() => setClearRemarksConfirm(false)} />
    </div>
  )
}
