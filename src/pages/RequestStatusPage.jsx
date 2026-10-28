import { useEffect, useMemo, useState } from 'react'
import { ArrowDownWideNarrow, ArrowRight, CheckCircle2, ClipboardList, Download, Eye, FileText, Filter, Hotel, Plane, Plus, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/ui/Modal.jsx'
import { AttachmentPreviewDialog } from '../components/ui/AttachmentPreviewDialog.jsx'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { useToast } from '../context/useToast.js'
import { ROUTES } from '../routes/paths.js'
import { getDemoRequests, updateDemoRequest } from '../utils/demoRequests.js'
import { getRequestStatusTone } from '../utils/requestStatus.js'
import { downloadDemoAttachment, getDemoAttachment, getDemoAttachments } from '../utils/demoAttachments.js'
import { clearDemoDraft, readDemoDraft, saveDemoDraft } from '../utils/demoDrafts.js'

const quotationSelectionDraftKey = (requestId) => `traveldesk-quote-selection:${requestId}`

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function distinctValues(requests, key) {
  return [...new Set(requests.map((request) => request[key]).filter(Boolean))]
}

function formatAmount(value, currency = 'INR') {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value))
}

function QuoteChoiceGroup({ requestId, kind, title, options, value, onChange, rejectedOptions = [], readOnly, onViewAttachment, onDownloadAttachment }) {
  const isTravel = kind === 'travel'
  const Icon = isTravel ? Plane : Hotel
  if (!options?.length) return null
  return (
    <fieldset className="request-quote-choice-group">
      <legend><Icon size={15} />{title}</legend>
      <div className="request-quote-choice-list">
        {options.map((option, index) => {
          const attachmentField = `${kind}-quote-${index + 1}-attachment`
          const isFinanceRejected = rejectedOptions.includes(index)
          return <div className="request-quote-choice-item" key={`${kind}-${index}`}>
            <label className={`request-quote-choice${value === index ? ' is-selected' : ''}${isFinanceRejected ? ' is-finance-rejected' : ''}`}>
              <input type="radio" name={`selected-${kind}-quote`} checked={value === index} disabled={isFinanceRejected || readOnly} onChange={() => onChange(index)} />
              <span className="request-quote-choice-content">
                <strong>{isTravel ? option.mode || 'Travel option' : option.hotelName || 'Hotel option'}</strong>
                <span>{isTravel ? `Airline / vendor · ${option.vendor || 'Not specified'}` : option.roomPlan || 'Stay plan not specified'}</span>
                {isFinanceRejected && <em>Rejected by Finance · choose another option</em>}
                {value === index && !isFinanceRejected && <em className="request-quote-selected-label">Selected by you</em>}
                <small className="request-quote-amount-label">Quoted price</small>
                <b>{formatAmount(option.amount, option.currency || 'INR')}</b>
                {option.currency === 'USD' && option.amountInr != null && <small>Approx. {formatAmount(option.amountInr, 'INR')} &middot; rate date {option.exchangeRateDate || 'unavailable'}</small>}
                {option.attachmentName && <small className="request-quote-file-name"><FileText size={12} />{option.attachmentName}</small>}
              </span>
            </label>
            {option.attachmentName && <div className="request-quote-file-actions"><button type="button" className="request-quote-file-action" onClick={() => onViewAttachment(requestId, attachmentField)}><Eye size={13} /> View</button><button type="button" className="request-quote-file-action" onClick={() => onDownloadAttachment(requestId, attachmentField)}><Download size={13} /> Download</button></div>}
          </div>
        })}
      </div>
    </fieldset>
  )
}

function RequestDocument({ request, field, fileName, label, detail, onView, onDownload, compact = false }) {
  if (!fileName) return <span className="document-empty">Not attached</span>
  if (request.status !== 'Booking Confirmed') return <span className="document-empty">{fileName}</span>
  return <div className={`request-document${compact ? ' is-compact' : ''}`}>
    <span className="request-document-name"><FileText size={12} />{fileName}</span>
    {detail && <small className="request-document-detail">{detail}</small>}
    <div><button type="button" aria-label={`View ${label}`} onClick={() => onView(request, field)}><Eye size={12} /> View {label}</button><button type="button" aria-label={`Download ${label}`} onClick={() => onDownload(request.requestId, field)}><Download size={12} /> Download {label}</button></div>
  </div>
}

function BookingDocumentCard({ title, actionLabel, field, fileName, details, required, request, onView, onDownload }) {
  return <article className={`request-booking-document${fileName ? '' : ' is-missing'}`}>
    <span className="request-booking-document-icon"><FileText size={17} /></span>
    <div className="request-booking-document-info"><strong>{title}</strong><span>{fileName || (required ? 'Document was not attached' : 'Not required for this trip')}</span>{fileName && details && <small>{details}</small>}</div>
    {fileName && <div className="request-booking-document-actions"><button type="button" onClick={() => onView(request, field)}><Eye size={14} /> View {actionLabel}</button><button type="button" onClick={() => onDownload(request.requestId, field)}><Download size={14} /> Download {actionLabel}</button></div>}
  </article>
}

function DetailList({ request, previewAttachment, onClosePreview, onViewAttachment, onDownloadAttachment }) {
  const selectedTravel = request.travelDeskQuotes?.travelQuotes?.[request.selectedQuoteOptions?.travel]
  const selectedHotel = request.travelDeskQuotes?.hotelQuotes?.[request.selectedQuoteOptions?.hotel]
  const items = [
    ['Request ID', request.requestId], ['Status', request.status],
    ['Employee name', request['employee-name']], ['Employee ID', request['employee-id']],
    ['Employee level', request['employee-level']], ['Department', request.department], ['Email', request['employee-email']], ['Reporting manager', request.reportingManager],
    ['Travel type', request['travel-type']], ['Billable / Non-billable', request['billing-type']], ['Travel category', request['travel-category']],
    ['From location', request['from-location']], ['To location', request['to-location']],
    ['Start date', formatDate(request['start-date'])], ['End date', formatDate(request['end-date'])], ['Duration days', request.duration],
    ['Travel required', request['travel-required']], ['Stay required', request['stay-required']], ['Purpose of travel', request['purpose-of-travel']],
    ['Manager review', request.reviewedBy ? `${request.reviewedBy}${request.reviewedAt ? ` · ${formatDate(request.reviewedAt.slice(0, 10))}` : ''}` : 'Awaiting manager review'],
    ['Manager remarks', request.managerRemarks || 'No remarks added.'],
    ['LOB review', request.lobReviewedBy ? `${request.lobReviewedBy}${request.lobReviewedAt ? ` · ${formatDate(request.lobReviewedAt.slice(0, 10))}` : ''}` : request.managerDecision === 'Approved' ? 'Awaiting LOB approval' : 'Not reached'],
    ['LOB remarks', request.lobRemarks || 'No remarks added.'],
    ['Travel Desk review', request.travelDeskReviewedBy ? `${request.travelDeskReviewedBy}${request.travelDeskReviewedAt ? ` · ${formatDate(request.travelDeskReviewedAt.slice(0, 10))}` : ''}` : request.lobDecision === 'Approved' ? 'Awaiting quotations' : 'Not reached'],
    ['Finance review', request.financeReviewedBy ? `${request.financeReviewedBy}${request.financeReviewedAt ? ` · ${formatDate(request.financeReviewedAt.slice(0, 10))}` : ''}` : request.status === 'Pending Finance Approval' ? 'Awaiting Finance review' : 'Not reached'],
    ['Finance remarks', request.financeRemarks || 'No remarks added.'],
    ['Selected travel option', selectedTravel ? `${selectedTravel.mode} · ${selectedTravel.vendor} · ${formatAmount(selectedTravel.amount, selectedTravel.currency || 'INR')}${selectedTravel.amountInr != null ? ` (≈ ${formatAmount(selectedTravel.amountInr, 'INR')})` : ''}` : 'Not selected'],
    ['Selected hotel option', selectedHotel ? `${selectedHotel.hotelName} · ${formatAmount(selectedHotel.amount, selectedHotel.currency || 'INR')}${selectedHotel.amountInr != null ? ` (≈ ${formatAmount(selectedHotel.amountInr, 'INR')})` : ''}` : 'Not selected'],
    ['Booking status', request.bookingConfirmedBy ? `Confirmed by ${request.bookingConfirmedBy}` : request.status === 'Finance Approved' ? 'Awaiting Travel Desk booking' : 'Not booked'],
    ['PNR / ticket reference', request.bookingDetails?.ticketReference || 'Not available'],
    ['Airline / booking provider', request.bookingDetails?.carrier || 'Not available'],
    ['Hotel details', request.bookingDetails?.hotelDetails || 'Not available'],
    ['Hotel confirmation reference', request.bookingDetails?.hotelConfirmation || 'Not available'],
  ]
  const previewIsImage = previewAttachment?.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(previewAttachment?.name || '')
  const previewIsPdf = previewAttachment?.type === 'application/pdf' || /\.pdf$/i.test(previewAttachment?.name || '')
  return <>
    {previewAttachment && <section className="request-attachment-preview" aria-label={`Preview ${previewAttachment.name}`}><header><div><Eye size={14} /><strong>{previewAttachment.name}</strong></div><button type="button" onClick={onClosePreview} aria-label="Close attachment preview"><X size={16} /></button></header>{previewIsImage ? <img src={previewAttachment.url} alt={`Preview of ${previewAttachment.name}`} /> : previewIsPdf ? <iframe src={previewAttachment.url} title={`Preview of ${previewAttachment.name}`} /> : <div className="request-attachment-preview-fallback"><FileText size={24} /><strong>Preview is not available for this file type.</strong><span>Download the attachment to open it on your device.</span></div>}</section>}
    {request.status === 'Booking Confirmed' && <section className="request-booking-documents"><header><div><strong>Your travel documents</strong><span>View or download each file uploaded by the Travel Desk.</span></div><CheckCircle2 size={17} /></header><div className="request-booking-document-grid"><BookingDocumentCard title="Ticket / e-ticket" actionLabel="ticket" field="booking-ticket" fileName={request.ticket} details={[request.bookingDetails?.ticketReference && `PNR: ${request.bookingDetails.ticketReference}`, request.bookingDetails?.carrier && `Airline: ${request.bookingDetails.carrier}`].filter(Boolean).join(' · ')} required={request['travel-required'] === 'Yes'} request={request} onView={onViewAttachment} onDownload={onDownloadAttachment} /><BookingDocumentCard title="Hotel voucher" actionLabel="hotel voucher" field="booking-hotel-voucher" fileName={request['hotel-voucher']} details={[request.bookingDetails?.hotelDetails, request.bookingDetails?.hotelConfirmation && `Confirmation: ${request.bookingDetails.hotelConfirmation}`].filter(Boolean).join(' · ')} required={request['stay-required'] === 'Yes'} request={request} onView={onViewAttachment} onDownload={onDownloadAttachment} /></div></section>}
    <dl className="request-detail-list">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
  </>
}

export function RequestStatusPage() {
  const navigate = useNavigate()
  const notify = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [typeFilter, setTypeFilter] = useState('All travel types')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [billingFilter, setBillingFilter] = useState('All billing types')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [quotationRequest, setQuotationRequest] = useState(null)
  const [quoteChoices, setQuoteChoices] = useState({ travel: null, hotel: null })
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [documentPreview, setDocumentPreview] = useState(null)
  const [storedDocumentNames, setStoredDocumentNames] = useState({})
  const [pendingQuotationAction, setPendingQuotationAction] = useState('')
  const [quotationSaving, setQuotationSaving] = useState(false)
  const [requests, setRequests] = useState(() => getDemoRequests())
  const quotationReadyRequests = useMemo(() => requests.filter((request) => ['Quotations Submitted', 'Rejected by Finance'].includes(request.status)), [requests])
  const statuses = useMemo(() => distinctValues(requests, 'status'), [requests])
  const travelTypes = useMemo(() => distinctValues(requests, 'travel-type'), [requests])
  const categories = useMemo(() => distinctValues(requests, 'travel-category'), [requests])
  const billingTypes = useMemo(() => distinctValues(requests, 'billing-type'), [requests])

  useEffect(() => {
    if (!previewAttachment?.url) return undefined
    return () => URL.revokeObjectURL(previewAttachment.url)
  }, [previewAttachment])

  useEffect(() => {
    let active = true
    Promise.all(requests.filter((request) => request.status === 'Booking Confirmed').map(async (request) => {
      try {
        const attachments = await getDemoAttachments(request.requestId)
        return [request.requestId, Object.fromEntries(attachments.filter((attachment) => ['booking-ticket', 'booking-hotel-voucher'].includes(attachment.fieldName)).map((attachment) => [attachment.fieldName, attachment.name]))]
      } catch {
        return [request.requestId, {}]
      }
    })).then((entries) => {
      if (active) setStoredDocumentNames(Object.fromEntries(entries))
    })
    return () => { active = false }
  }, [requests])

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const searchText = [
      request.requestId, request['employee-name'], request['employee-id'], request['employee-level'],
      request.department, request['employee-email'], request['travel-type'], request['billing-type'],
      request['travel-category'], request['from-location'], request['to-location'], request['purpose-of-travel'],
    ].join(' ').toLowerCase()
    const matchesQuery = searchText.includes(query.trim().toLowerCase())
    const matchesStatus = statusFilter === 'All statuses' || request.status === statusFilter
    const matchesType = typeFilter === 'All travel types' || request['travel-type'] === typeFilter
    const matchesCategory = categoryFilter === 'All categories' || request['travel-category'] === categoryFilter
    const matchesBilling = billingFilter === 'All billing types' || request['billing-type'] === billingFilter
    const matchesFromDate = !dateFrom || !request['start-date'] || request['start-date'] >= dateFrom
    const matchesToDate = !dateTo || !request['start-date'] || request['start-date'] <= dateTo
    return matchesQuery && matchesStatus && matchesType && matchesCategory && matchesBilling && matchesFromDate && matchesToDate
  }), [billingFilter, categoryFilter, dateFrom, dateTo, query, requests, statusFilter, typeFilter])

  function downloadAttachment(requestId, fieldName) {
    downloadDemoAttachment(requestId, fieldName).then((downloaded) => {
      if (!downloaded) notify('This attachment is no longer available in browser storage.', 'error')
    }).catch(() => notify('The saved attachment could not be opened.', 'error'))
  }

  function viewAttachment(requestId, fieldName) {
    getDemoAttachment(requestId, fieldName).then((attachment) => {
      if (!attachment) {
        notify('This attachment is no longer available in browser storage.', 'error')
        return
      }
      setPreviewAttachment({ ...attachment, url: URL.createObjectURL(attachment.file) })
    }).catch(() => notify('The saved attachment could not be previewed.', 'error'))
  }

  function viewRequestDocument(request, fieldName) {
    getDemoAttachment(request.requestId, fieldName).then((attachment) => {
      if (!attachment) {
        notify('This attachment is no longer available in browser storage.', 'error')
        return
      }
      setDocumentPreview(attachment)
    }).catch(() => notify('The saved attachment could not be previewed.', 'error'))
  }

  function documentName(request, fieldName, fallback = '') {
    return storedDocumentNames[request.requestId]?.[fieldName] || fallback
  }

  function closeModal() {
    if (quotationSaving) return
    setPendingQuotationAction('')
    if (quotationRequest) clearDemoDraft(quotationSelectionDraftKey(quotationRequest.requestId))
    setSelectedRequest(null)
    setQuotationRequest(null)
    setQuoteChoices({ travel: null, hotel: null })
    setPreviewAttachment(null)
    setDocumentPreview(null)
  }

  function requestCloseModal() {
    if (quotationSaving) return
    if (quotationRequest && ['Quotations Submitted', 'Rejected by Finance'].includes(quotationRequest.status)) {
      const draft = readDemoDraft(quotationSelectionDraftKey(quotationRequest.requestId))
      if (Object.hasOwn(draft, 'travel') || Object.hasOwn(draft, 'hotel')) {
        setPendingQuotationAction('close')
        return
      }
    }
    closeModal()
  }

  function openQuotation(request) {
    setQuotationRequest(request)
    setPreviewAttachment(null)
    const draft = readDemoDraft(quotationSelectionDraftKey(request.requestId))
    const needsReselection = request.status === 'Rejected by Finance'
    setQuoteChoices({
      travel: Object.hasOwn(draft, 'travel') ? draft.travel : needsReselection ? null : request.selectedQuoteOptions?.travel ?? null,
      hotel: Object.hasOwn(draft, 'hotel') ? draft.hotel : needsReselection ? null : request.selectedQuoteOptions?.hotel ?? null,
    })
  }

  function updateQuoteChoice(kind, value) {
    const next = { ...quoteChoices, [kind]: value }
    setQuoteChoices(next)
    if (quotationRequest && !saveDemoDraft(quotationSelectionDraftKey(quotationRequest.requestId), next)) {
      notify('Your unsent quotation choices could not be saved in this browser.', 'error')
    }
  }

  function clearQuoteSelectionDraft() {
    if (!quotationRequest || quotationSaving) return
    setPendingQuotationAction('clear')
  }

  function clearQuoteSelection() {
    if (!quotationRequest || quotationSaving) return
    const emptyChoices = { travel: null, hotel: null }
    setQuoteChoices(emptyChoices)
    if (!saveDemoDraft(quotationSelectionDraftKey(quotationRequest.requestId), emptyChoices)) {
      notify('Your quotation choices could not be cleared from browser storage.', 'error')
      return
    }
    notify('Unsaved quotation choices cleared.', 'success')
    setPendingQuotationAction('')
  }

  function confirmQuotationSelection() {
    if (!quotationRequest || quotationSaving || pendingQuotationAction !== 'submit') return
    const needsTravel = quotationRequest['travel-required'] === 'Yes'
    const needsHotel = quotationRequest['stay-required'] === 'Yes'
    setQuotationSaving(true)
    try {
      const updated = updateDemoRequest(quotationRequest.requestId, {
        status: needsTravel || needsHotel ? 'Pending Finance Approval' : quotationRequest.status,
        selectedQuoteOptions: { travel: needsTravel ? quoteChoices.travel : null, hotel: needsHotel ? quoteChoices.hotel : null },
        financeDecision: 'Pending',
        quotationSelectedAt: new Date().toISOString(),
      })
      if (!updated) throw new Error('This travel request is no longer available.')
      clearDemoDraft(quotationSelectionDraftKey(quotationRequest.requestId))
      const updatedRequests = getDemoRequests()
      setRequests(updatedRequests)
      setQuotationRequest(updatedRequests.find((request) => request.requestId === quotationRequest.requestId) || null)
      setPendingQuotationAction('')
      notify(needsTravel || needsHotel ? 'Quotation selection sent to Finance for review.' : 'Travel Desk review is complete.', 'success')
    } catch {
      notify('Your quotation selection could not be saved in this browser. Please retry.', 'error')
    } finally {
      setQuotationSaving(false)
    }
  }

  function requestQuotationSubmission() {
    if (!quotationRequest || quotationSaving || pendingQuotationAction) return
    const needsTravel = quotationRequest['travel-required'] === 'Yes'
    const needsHotel = quotationRequest['stay-required'] === 'Yes'
    const rejected = quotationRequest.financeRejectedSelections || { travel: [], hotel: [] }
    if ((needsTravel && (quoteChoices.travel === null || rejected.travel?.includes(quoteChoices.travel)))
      || (needsHotel && (quoteChoices.hotel === null || rejected.hotel?.includes(quoteChoices.hotel)))) {
      notify('Choose an available option for each required service before continuing.', 'warning')
      return
    }
    setPendingQuotationAction('submit')
  }

  return (
    <div className="status-page">
      <div className="status-breadcrumb"><button type="button" onClick={() => navigate(ROUTES.welcome)}>Home</button><span>/</span><span>Travel requests</span></div>
      <header className="status-page-heading"><div className="status-title-icon"><ClipboardList size={20} /></div><div><p className="status-eyebrow">TRAVEL DESK · REQUESTS</p><h1>Travel request status</h1><p>Review and filter submitted travel requests.</p></div><button type="button" className="status-new-button" onClick={() => navigate(ROUTES.newRequest)}><Plus size={16} /> New request</button></header>

      {quotationReadyRequests.length > 0 && <section className={`status-quotation-ready${quotationReadyRequests[0].status === 'Rejected by Finance' ? ' is-reselection' : ''}`}><span className="status-quotation-ready-icon"><Plane size={17} /></span><div><strong>{quotationReadyRequests[0].status === 'Rejected by Finance' ? 'Finance requested a different quotation' : quotationReadyRequests.length === 1 ? 'Travel Desk quotations are ready' : `${quotationReadyRequests.length} requests have quotations ready`}</strong><p>{quotationReadyRequests[0].requestId} · {quotationReadyRequests[0]['from-location'] || 'Origin'} to {quotationReadyRequests[0]['to-location'] || 'destination'} · {quotationReadyRequests[0].status === 'Rejected by Finance' ? 'Choose a different option to send it back for finance review.' : 'Choose your preferred travel and stay options.'}</p></div><button type="button" onClick={() => openQuotation(quotationReadyRequests[0])}>{quotationReadyRequests[0].status === 'Rejected by Finance' ? 'Choose again' : 'Review quotations'} <ArrowRight size={14} /></button></section>}

      <section className="status-list-card">
        <div className="status-list-heading"><div><h2>Requests</h2><p>{requests.length} {requests.length === 1 ? 'request' : 'requests'} saved in this browser</p></div><span className="demo-data-tag"><span /> DEMO DATA</span></div>
        <div className="status-filter-bar">
          <label className="status-search" htmlFor="request-search"><Search size={16} /><input id="request-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search request, employee, destination..." /></label>
          <label className="status-select-filter" htmlFor="status-filter"><SlidersHorizontal size={15} /><select id="status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="status-select-filter" htmlFor="category-filter"><select id="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="status-select-filter" htmlFor="type-filter"><select id="type-filter" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All travel types</option>{travelTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <button type="button" className={`status-more-filters${showMoreFilters ? ' is-open' : ''}`} aria-expanded={showMoreFilters} onClick={() => setShowMoreFilters((visible) => !visible)}><Filter size={14} /> More filters</button>
          <span className="status-result-count"><ArrowDownWideNarrow size={14} /> {filteredRequests.length} shown</span>
        </div>
        {showMoreFilters && <div className="status-extra-filters"><label htmlFor="billing-filter">Bill / Unbill<select id="billing-filter" value={billingFilter} onChange={(event) => setBillingFilter(event.target.value)}><option>All billing types</option>{billingTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label htmlFor="date-from-filter">Start date from<input id="date-from-filter" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label htmlFor="date-to-filter">Start date to<input id="date-to-filter" type="date" min={dateFrom || undefined} value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label><button type="button" onClick={() => { setBillingFilter('All billing types'); setDateFrom(''); setDateTo('') }}>Clear extra filters</button></div>}

        {filteredRequests.length ? (
          <>
          <div className="status-table-scroll"><table className="status-table"><thead><tr>
            <th>Request ID</th><th>Status</th><th>Employee name</th><th>Employee ID</th><th>Employee level</th><th>Department</th><th>Email</th><th>Travel type</th><th>Bill / Unbill</th><th>Travel category</th><th>From location</th><th>To location</th><th>Start date</th><th>End date</th><th>Duration days</th><th>Travel required</th><th>Stay required</th><th>Purpose of travel</th><th>Ticket</th><th>Hotel voucher</th><th>Select quotation</th><th>Request details</th>
          </tr></thead><tbody>{filteredRequests.map((request) => <tr key={request.requestId}>
            <td className="status-request-id">{request.requestId}</td>
            <td><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></td>
            <td>{request['employee-name'] || '—'}</td>
            <td>{request['employee-id'] || '—'}</td>
            <td>{request['employee-level'] || '—'}</td>
            <td>{request.department || '—'}</td>
            <td>{request['employee-email'] || '—'}</td>
            <td>{request['travel-type'] || '—'}</td>
            <td>{request['billing-type'] || '—'}</td>
            <td>{request['travel-category'] || '—'}</td>
            <td>{request['from-location'] || '—'}</td>
            <td>{request['to-location'] || '—'}</td>
            <td>{formatDate(request['start-date'])}</td>
            <td>{formatDate(request['end-date'])}</td>
            <td>{request.duration || '—'}</td>
            <td>{request['travel-required'] || '—'}</td>
            <td>{request['stay-required'] || '—'}</td>
            <td className="status-purpose-cell">{request['purpose-of-travel'] || '—'}</td>
            <td><RequestDocument request={request} field="booking-ticket" fileName={documentName(request, 'booking-ticket', request.ticket)} label="ticket" detail={[request.bookingDetails?.ticketReference && `PNR: ${request.bookingDetails.ticketReference}`, request.bookingDetails?.carrier && `Carrier: ${request.bookingDetails.carrier}`].filter(Boolean).join(' · ')} onView={viewRequestDocument} onDownload={downloadAttachment} compact /></td>
            <td><RequestDocument request={request} field="booking-hotel-voucher" fileName={documentName(request, 'booking-hotel-voucher', request['hotel-voucher'])} label="hotel voucher" detail={[request.bookingDetails?.hotelDetails && `Hotel: ${request.bookingDetails.hotelDetails}`, request.bookingDetails?.hotelConfirmation && `Confirmation: ${request.bookingDetails.hotelConfirmation}`].filter(Boolean).join(' · ')} onView={viewRequestDocument} onDownload={downloadAttachment} compact /></td>
            <td><button type="button" className="quotation-button" disabled={!['Quotations Submitted', 'Rejected by Finance', 'Quotation Selected', 'Pending Finance Approval', 'Finance Approved', 'Booking Confirmed'].includes(request.status)} onClick={() => openQuotation(request)}>{request.status === 'Rejected by Finance' ? 'Choose again' : ['Quotation Selected', 'Pending Finance Approval'].includes(request.status) ? 'Awaiting finance' : request.status === 'Finance Approved' ? 'Finance approved' : request.status === 'Booking Confirmed' ? 'View selected quotes' : request.status === 'Quotations Submitted' ? 'Choose quotes' : request.status === 'Pending Travel Desk' ? 'Awaiting quotes' : 'Awaiting approval'}</button></td>
            <td><button type="button" className="request-view-button" aria-label={`View request details for ${request.requestId}`} onClick={() => setSelectedRequest(request)}><Eye size={15} /> View request</button></td>
          </tr>)}</tbody></table></div>
          <div className="status-mobile-list" aria-label="Travel requests">
            {filteredRequests.map((request) => <article className="status-mobile-card" key={`mobile-${request.requestId}`}>
              <header className="status-mobile-card-header"><div><strong>{request.requestId}</strong><span>{request['employee-name'] || 'Employee'}{request['employee-id'] ? ` · ${request['employee-id']}` : ''}</span></div><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></header>
              <div className="status-mobile-route"><span>{request['from-location'] || '—'}</span><ArrowRight size={14} aria-hidden="true" /><span>{request['to-location'] || '—'}</span></div>
              <div className="status-mobile-meta"><span><small>Travel dates</small>{formatDate(request['start-date'])} – {formatDate(request['end-date'])}</span><span><small>Trip purpose</small>{request['travel-category'] || request['purpose-of-travel'] || '—'}</span></div>
              <div className="status-mobile-documents">
                <section><h3><Plane size={14} /> Ticket</h3><RequestDocument request={request} field="booking-ticket" fileName={documentName(request, 'booking-ticket', request.ticket)} label="ticket" detail={[request.bookingDetails?.ticketReference && `PNR: ${request.bookingDetails.ticketReference}`, request.bookingDetails?.carrier && `Carrier: ${request.bookingDetails.carrier}`].filter(Boolean).join(' · ')} onView={viewRequestDocument} onDownload={downloadAttachment} compact /></section>
                <section><h3><Hotel size={14} /> Hotel voucher</h3><RequestDocument request={request} field="booking-hotel-voucher" fileName={documentName(request, 'booking-hotel-voucher', request['hotel-voucher'])} label="hotel voucher" detail={[request.bookingDetails?.hotelDetails && `Hotel: ${request.bookingDetails.hotelDetails}`, request.bookingDetails?.hotelConfirmation && `Confirmation: ${request.bookingDetails.hotelConfirmation}`].filter(Boolean).join(' · ')} onView={viewRequestDocument} onDownload={downloadAttachment} compact /></section>
              </div>
              <footer className="status-mobile-actions">
                <button type="button" className="quotation-button" disabled={!['Quotations Submitted', 'Rejected by Finance', 'Quotation Selected', 'Pending Finance Approval', 'Finance Approved', 'Booking Confirmed'].includes(request.status)} onClick={() => openQuotation(request)}>{request.status === 'Rejected by Finance' ? 'Choose again' : ['Quotation Selected', 'Pending Finance Approval'].includes(request.status) ? 'Awaiting finance' : request.status === 'Finance Approved' ? 'Finance approved' : request.status === 'Booking Confirmed' ? 'View selected quotes' : request.status === 'Quotations Submitted' ? 'Choose quotes' : request.status === 'Pending Travel Desk' ? 'Awaiting quotes' : 'Awaiting approval'}</button>
                <button type="button" className="request-view-button" onClick={() => setSelectedRequest(request)}><Eye size={15} /> View request</button>
              </footer>
            </article>)}
          </div>
          </>
        ) : (
          <div className="status-empty"><span><ClipboardList size={22} /></span><h3>{requests.length ? 'No matching requests' : 'No requests submitted yet'}</h3><p>{requests.length ? 'Try changing or clearing your filters.' : 'Submit a travel request to see it listed here.'}</p>{!requests.length && <button type="button" onClick={() => navigate(ROUTES.newRequest)}>Create a request <ArrowRight size={15} /></button>}</div>
        )}
        <footer className="status-list-footer"><span>Demo requests are saved in this browser on this device.</span><span>Showing {filteredRequests.length} of {requests.length}</span></footer>
      </section>

      <Modal open={Boolean(selectedRequest || (quotationRequest && !pendingQuotationAction))} title={selectedRequest ? `Request ${selectedRequest.requestId}` : quotationRequest ? `Quotation options · ${quotationRequest.requestId}` : 'Request details'} onClose={requestCloseModal} className={quotationRequest ? 'modal-quotation' : selectedRequest ? 'modal-request-details' : ''}>
        {selectedRequest && <DetailList request={{ ...selectedRequest, ticket: documentName(selectedRequest, 'booking-ticket', selectedRequest.ticket), 'hotel-voucher': documentName(selectedRequest, 'booking-hotel-voucher', selectedRequest['hotel-voucher']) }} previewAttachment={previewAttachment} onClosePreview={() => setPreviewAttachment(null)} onViewAttachment={viewRequestDocument} onDownloadAttachment={downloadAttachment} />}
        {quotationRequest && <QuotationSelection request={quotationRequest} choices={quoteChoices} previewAttachment={previewAttachment} onClosePreview={() => setPreviewAttachment(null)} onChange={updateQuoteChoice} onClear={clearQuoteSelectionDraft} onConfirm={requestQuotationSubmission} isSaving={quotationSaving} onViewAttachment={viewAttachment} onDownloadAttachment={downloadAttachment} />}
      </Modal>
      <ConfirmationDialog open={Boolean(pendingQuotationAction)} title={pendingQuotationAction === 'submit' ? 'Send your selection to Finance?' : pendingQuotationAction === 'clear' ? 'Clear your quotation choices?' : 'Discard your unsent quotation choices?'} message={pendingQuotationAction === 'submit' ? 'The selected options will be submitted for Finance review.' : pendingQuotationAction === 'clear' ? 'This will remove your current unsent quotation choices from the form.' : 'Closing now will discard these unsent options. Your previously submitted choices will not change.'} confirmLabel={pendingQuotationAction === 'submit' ? 'Send to Finance' : pendingQuotationAction === 'clear' ? 'Clear choices' : 'Discard choices'} tone={pendingQuotationAction === 'submit' ? 'primary' : 'danger'} busy={quotationSaving} onConfirm={pendingQuotationAction === 'submit' ? confirmQuotationSelection : pendingQuotationAction === 'clear' ? clearQuoteSelection : closeModal} onCancel={() => !quotationSaving && setPendingQuotationAction('')} />
      <AttachmentPreviewDialog attachment={documentPreview} onClose={() => setDocumentPreview(null)} />
    </div>
  )
}

function QuotationSelection({ request, choices, previewAttachment, onClosePreview, onChange, onClear, onConfirm, isSaving, onViewAttachment, onDownloadAttachment }) {
  const travelOptions = request.travelDeskQuotes?.travelQuotes || []
  const hotelOptions = request.travelDeskQuotes?.hotelQuotes || []
  const needsTravel = request['travel-required'] === 'Yes'
  const needsHotel = request['stay-required'] === 'Yes'
  const hasChoices = travelOptions.length > 0 || hotelOptions.length > 0
  const isReselection = request.status === 'Rejected by Finance'
  const canEditSelection = ['Quotations Submitted', 'Rejected by Finance'].includes(request.status)
  const rejectedSelections = request.financeRejectedSelections || { travel: [], hotel: [] }
  const canConfirm = canEditSelection && (!needsTravel || (travelOptions.length > 0 && choices.travel !== null && !rejectedSelections.travel?.includes(choices.travel))) && (!needsHotel || (hotelOptions.length > 0 && choices.hotel !== null && !rejectedSelections.hotel?.includes(choices.hotel)))
  const isAlreadySelected = ['Quotation Selected', 'Pending Finance Approval', 'Finance Approved', 'Booking Confirmed'].includes(request.status)

  if (!hasChoices) {
    const needsQuotations = needsTravel || needsHotel
    const isWaiting = request.status === 'Pending Travel Desk' || request.status.startsWith('Pending')
    const heading = needsQuotations ? (isWaiting ? 'Waiting for Travel Desk quotations' : 'Quotations are not available yet') : 'No quotations required'
    const message = needsQuotations ? (isWaiting ? 'This request is moving through approval or Travel Desk review. Submitted travel or stay options will appear here.' : 'No travel or stay quotation has been submitted for this request yet.') : 'Travel Desk can complete the review without travel or stay options for this request.'
    return <div className="quotation-empty"><span><ClipboardList size={22} /></span><h3>{heading}</h3><p>{message}</p></div>
  }

  const imagePreview = previewAttachment?.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(previewAttachment?.name || '')
  const pdfPreview = previewAttachment?.type === 'application/pdf' || /\.pdf$/i.test(previewAttachment?.name || '')

  return <div className="request-quotation-selection"><div className="request-quote-intro"><div><span className="status-eyebrow">REQUEST {request.requestId}</span><h3>{isReselection ? 'Choose a different quotation' : isAlreadySelected ? 'Your selected quotations' : 'Compare your quotation options'}</h3><p>{isReselection ? `Finance asked for another option${request.financeRemarks ? `: ${request.financeRemarks}` : '.'} Previously rejected options are disabled.` : canEditSelection ? 'Select one option for each service requested. Review the vendor, price and attached quote before confirming.' : request.status === 'Finance Approved' ? 'Finance approved these selections. Travel Desk is preparing the booking.' : request.status === 'Booking Confirmed' ? 'Travel Desk has confirmed this booking. These are the final selected quotations.' : 'These selections are waiting for Finance review.'}</p></div><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></div>
    {previewAttachment && <section className="request-attachment-preview" aria-label={`Preview ${previewAttachment.name}`}><header><div><Eye size={14} /><strong>{previewAttachment.name}</strong></div><button type="button" onClick={onClosePreview} aria-label="Close attachment preview"><X size={16} /></button></header>{imagePreview ? <img src={previewAttachment.url} alt={`Preview of ${previewAttachment.name}`} /> : pdfPreview ? <iframe src={previewAttachment.url} title={`Preview of ${previewAttachment.name}`} /> : <div className="request-attachment-preview-fallback"><FileText size={24} /><strong>Preview isn’t available for this file type.</strong><span>Download the attachment to open it on your device.</span></div>}</section>}
    {travelOptions.length > 0 && <QuoteChoiceGroup requestId={request.requestId} kind="travel" title={canEditSelection ? 'Travel options · select one' : 'Travel options'} options={travelOptions} value={choices.travel} rejectedOptions={rejectedSelections.travel} readOnly={!canEditSelection} onChange={(travel) => onChange('travel', travel)} onViewAttachment={onViewAttachment} onDownloadAttachment={onDownloadAttachment} />}
    {hotelOptions.length > 0 && <QuoteChoiceGroup requestId={request.requestId} kind="hotel" title={canEditSelection ? 'Stay options · select one' : 'Stay options'} options={hotelOptions} value={choices.hotel} rejectedOptions={rejectedSelections.hotel} readOnly={!canEditSelection} onChange={(hotel) => onChange('hotel', hotel)} onViewAttachment={onViewAttachment} onDownloadAttachment={onDownloadAttachment} />}
    {((needsTravel && travelOptions.length === 0) || (needsHotel && hotelOptions.length === 0)) && <p className="request-quote-missing-options">Some required quotations are missing. Please contact the Travel Desk before confirming.</p>}
    <p className="request-quote-demo-note">Your choices stay as a draft until you send them to Finance. Closing this dialog clears unsent choices.</p>
    <div className="request-quote-actions">{canEditSelection ? <><button type="button" className="request-quote-clear" disabled={isSaving} onClick={onClear}><RotateCcw size={13} /> Clear selection</button><button type="button" className="status-new-button" disabled={!canConfirm || isSaving} onClick={onConfirm}>{isSaving ? 'Saving…' : isReselection ? 'Resubmit selection' : 'Send to Finance'} {!isSaving && <ArrowRight size={14} />}</button></> : <span className="request-finance-waiting"><CheckCircle2 size={14} /> {request.status === 'Finance Approved' ? 'Finance approved' : request.status === 'Booking Confirmed' ? 'Booking confirmed' : 'Waiting for Finance review'}</span>}</div>
  </div>
}
