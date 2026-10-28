import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, CalendarDays, CarFront, CheckCircle2, ClipboardList, Clock3, Download, Eye, FileText, Hotel, MapPin, Plane, RefreshCw, RotateCcw, Search, Upload, WalletCards, X } from 'lucide-react'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'
import { AttachmentPreviewDialog } from '../components/ui/AttachmentPreviewDialog.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { DEMO_TRAVEL_DESK } from '../constants/demoUsers.js'
import { ROUTES } from '../routes/paths.js'
import { useToast } from '../context/useToast.js'
import { getDemoRequests, updateDemoRequest } from '../utils/demoRequests.js'
import { clearDemoDraft, readDemoDraft, saveDemoDraft } from '../utils/demoDrafts.js'
import { clearDemoAttachments, downloadDemoAttachment, getDemoAttachment, getDemoAttachments, saveDemoAttachment } from '../utils/demoAttachments.js'
import { getRequestStatusTone } from '../utils/requestStatus.js'

const USD_INR_RATE_URL = 'https://api.frankfurter.dev/v2/rate/usd/inr'
const QUEUE_FILTER_KEY = 'traveldesk-queue-active-filter'
const quotationDraftKey = (id) => `traveldesk-quotation-draft:${id}`
const attachmentCleanupTasks = new Map()

function clearAttachmentsForRequest(requestId) {
  const cleanup = clearDemoAttachments(requestId)
  attachmentCleanupTasks.set(requestId, cleanup)
  const removeTask = () => {
    if (attachmentCleanupTasks.get(requestId) === cleanup) attachmentCleanupTasks.delete(requestId)
  }
  cleanup.then(removeTask, removeTask)
  return cleanup
}

async function waitForAttachmentCleanup(requestId) {
  await attachmentCleanupTasks.get(requestId)
}

function useUsdInrRate() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [rateState, setRateState] = useState({ rate: null, date: '', loading: true, error: false })

  useEffect(() => {
    const controller = new AbortController()
    setRateState((current) => ({ ...current, loading: true, error: false }))
    fetch(USD_INR_RATE_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Exchange rate request failed')
        return response.json()
      })
      .then((data) => {
        const rate = Number(data.rate)
        if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid exchange rate')
        setRateState({ rate, date: data.date || '', loading: false, error: false })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setRateState((current) => ({ ...current, loading: false, error: true }))
      })
    return () => controller.abort()
  }, [refreshKey])

  return { ...rateState, refresh: () => setRefreshKey((key) => key + 1) }
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatAmount(value, currency = 'INR') {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value))
}

function getTripCurrency(travelType) {
  return travelType?.toLowerCase() === 'international' ? 'USD' : 'INR'
}

function MoneyField({ label, name, currency, value, rate, onChange }) {
  const isUsd = currency === 'USD'
  const numericValue = Number(value)
  const inrEstimate = isUsd && Number.isFinite(numericValue) && numericValue > 0 && rate
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(numericValue * rate)
    : null
  return (
    <label className="desk-field">
      <span>{label} ({currency})</span>
      <span className="desk-money-entry">
        <span className="desk-currency-input"><b>{currency === 'USD' ? '$' : '₹'}</b><input name={name} type="number" min="0.01" step="0.01" placeholder="0.00" value={value ?? ''} onChange={(event) => onChange(name, event.target.value)} required /></span>
        {isUsd && <small className="desk-conversion-caption">{inrEstimate ? `Approx. ${inrEstimate} at the displayed reference rate` : 'INR estimate unavailable until the rate loads'}</small>}
      </span>
    </label>
  )
}

function FxRateCard({ rateState, onRefresh }) {
  const { rate, date, loading, error } = rateState
  return <aside className="desk-fx-card" aria-live="polite"><span className="desk-fx-icon">$</span><div className="desk-fx-copy"><strong>Indicative USD / INR rate</strong><span>{rate ? `1 USD = ${formatAmount(rate, 'INR')}` : loading ? 'Fetching the latest daily reference rate…' : 'Current rate is unavailable. USD quotations can still be entered.'}</span><small>{rate ? `Rate date: ${date || 'latest available'} · Use your finance-approved rate for final settlement.` : error ? 'Check your connection and refresh to load a reference rate.' : 'Daily reference rate'}</small></div><button type="button" className="desk-fx-refresh" onClick={onRefresh} disabled={loading} aria-label="Refresh USD to INR rate"><RefreshCw size={14} className={loading ? 'is-spinning' : ''} /> Refresh rate</button></aside>
}

function RequestSummary({ request }) {
  const fields = [
    ['Employee name', request['employee-name'], Building2],
    ['Employee ID', request['employee-id']],
    ['Department', request.department],
    ['Email address', request['employee-email']],
    ['Travel type', request['travel-type']],
    ['Travel category', request['travel-category']],
    ['From location', request['from-location'], MapPin],
    ['To location', request['to-location'], MapPin],
    ['Travel required', request['travel-required']],
    ['Stay required', request['stay-required']],
    ['Start date', formatDate(request['start-date']), CalendarDays],
    ['End date', formatDate(request['end-date']), CalendarDays],
    ['Duration', request.duration ? `${request.duration} ${Number(request.duration) === 1 ? 'day' : 'days'}` : '—'],
    ['Purpose of travel', request['purpose-of-travel']],
  ]

  return <div className="desk-summary-grid">{fields.map(([label, value, Icon]) => <div className="desk-summary-item" key={label}><span>{Icon ? <Icon size={14} /> : null}{label}</span><strong>{value || '—'}</strong></div>)}</div>
}

function QuoteOption({ kind, number, fileName, onFileChange, existingQuote, currency, amount, rate, onAmountChange, values, hasSavedAttachment, onViewAttachment, onDownloadAttachment }) {
  const travel = kind === 'travel'
  const prefix = `${kind}-quote-${number}`
  const attachmentField = `${prefix}-attachment`
  return (
    <article className="desk-quote-option">
      <header className="desk-quote-option-heading"><span className="desk-quote-option-number">0{number}</span><div><strong>{travel ? `Travel quotation ${number}` : `Hotel quotation ${number}`}</strong><small>{travel ? 'Enter fare and attach the vendor quotation.' : 'Add the hotel option and attach its quotation.'}</small></div>{existingQuote && <StatusBadge tone="success">Saved</StatusBadge>}</header>
      {existingQuote ? <div className="desk-saved-quote-grid">
        {travel ? <><div><small>Transport mode</small><strong>{existingQuote.mode || '—'}</strong></div><div><small>Vendor</small><strong>{existingQuote.vendor || '—'}</strong></div></> : <><div><small>Hotel</small><strong>{existingQuote.hotelName || '—'}</strong></div><div><small>Room / plan</small><strong>{existingQuote.roomPlan || '—'}</strong></div></>}
        <div><small>Quoted amount</small><strong>{formatAmount(existingQuote.amount, existingQuote.currency || 'INR')}</strong>{existingQuote.currency === 'USD' && existingQuote.amountInr != null && <small className="desk-saved-equivalent">≈ {formatAmount(existingQuote.amountInr, 'INR')}</small>}</div>
        <div><small>Attachment</small>{existingQuote.attachmentName ? <div className="desk-quote-file-actions"><span><FileText size={13} />{existingQuote.attachmentName}</span><button type="button" onClick={() => onViewAttachment?.(attachmentField)}><Eye size={13} /> View</button><button type="button" onClick={() => onDownloadAttachment?.(attachmentField)}><Download size={13} /> Download</button></div> : <strong>No file attached</strong>}</div>
      </div> : <div className="desk-quote-fields">
        {travel ? <>
          <label className="desk-field"><span>Transport mode</span><input name={`${prefix}-mode`} type="text" placeholder="e.g. Flight, train or cab" defaultValue={values[`${prefix}-mode`] || ''} required /></label>
          <label className="desk-field"><span>Airline / vendor</span><input name={`${prefix}-vendor`} type="text" placeholder="e.g. Indigo, IRCTC, City Cabs" defaultValue={values[`${prefix}-vendor`] || ''} required /></label>
        </> : <>
          <label className="desk-field"><span>Hotel name</span><input name={`${prefix}-hotel`} type="text" placeholder="Enter hotel or property name" defaultValue={values[`${prefix}-hotel`] || ''} required /></label>
          <label className="desk-field"><span>Room / plan</span><input name={`${prefix}-room-plan`} type="text" placeholder="e.g. Deluxe, breakfast included" defaultValue={values[`${prefix}-room-plan`] || ''} required /></label>
        </>}
        <MoneyField label="Quotation amount" name={`${prefix}-amount`} currency={currency} value={amount} rate={rate} onChange={onAmountChange} />
        <div className="desk-upload-field"><span>Quotation attachment</span><span className="desk-upload-control"><Upload size={15} /><span>{fileName || 'Choose PDF or image'}</span><input name={attachmentField} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" required={!hasSavedAttachment} onChange={(event) => onFileChange(attachmentField, event.target.files?.[0] || null)} /></span>{(fileName || hasSavedAttachment) && <span className="desk-selected-quote-file"><span><FileText size={13} />{fileName || 'Saved quotation file'}</span><button type="button" onClick={() => onViewAttachment?.(attachmentField)}><Eye size={13} /> Preview before submit</button></span>}</div>
      </div>}
    </article>
  )
}

function QuoteSection({ kind, title, description, icon, fileNames, onFileChange, existingQuotes, currency, amounts, rate, onAmountChange, values, savedAttachmentKeys, onViewAttachment, onDownloadAttachment }) {
  return (
    <section className="desk-form-section">
      <header className="desk-section-heading"><span className="desk-section-icon">{icon}</span><div><p>SECTION · {kind === 'travel' ? '02' : '03'}</p><h2>{title}</h2><span>{description}</span></div><span className="desk-required-tag">3 options required</span></header>
      <div className="desk-quote-options">{[1, 2, 3].map((number) => { const amountName = `${kind}-quote-${number}-amount`; const attachmentField = `${kind}-quote-${number}-attachment`; return <QuoteOption key={`${kind}-${number}`} kind={kind} number={number} fileName={fileNames[attachmentField]} onFileChange={onFileChange} existingQuote={existingQuotes?.[number - 1]} currency={currency} amount={amounts[amountName]} rate={rate} onAmountChange={onAmountChange} values={values} hasSavedAttachment={savedAttachmentKeys?.has(attachmentField)} onViewAttachment={onViewAttachment} onDownloadAttachment={onDownloadAttachment} /> })}</div>
    </section>
  )
}

function SavedEstimate({ estimate }) {
  if (!estimate) return null
  return <section className="desk-form-section"><header className="desk-section-heading"><span className="desk-section-icon"><CarFront size={18} /></span><div><p>SECTION &middot; 01</p><h2>Cab / taxi estimate</h2><span>Estimated local ground transportation cost.</span></div></header><div className="desk-estimate-readonly"><div><small>Trip type</small><strong>{estimate.type || '—'}</strong></div><div><small>Cab / vendor</small><strong>{estimate.vendor || '—'}</strong></div><div><small>Cost per day</small><strong>{estimate.costPerDay != null ? formatAmount(estimate.costPerDay, estimate.currency || 'INR') : '—'}</strong></div><div><small>No. of days</small><strong>{estimate.days || '—'}</strong></div><div><small>Total amount</small><strong>{formatAmount(estimate.totalAmount, estimate.currency || 'INR')}</strong>{estimate.currency === 'USD' && estimate.amountInr != null && <small className="desk-saved-equivalent">&asymp; {formatAmount(estimate.amountInr, 'INR')}</small>}</div></div></section>
}

export function TravelDeskPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const notify = useToast()
  const [requests, setRequests] = useState(() => getDemoRequests())
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState(() => readDemoDraft(QUEUE_FILTER_KEY).activeFilter || 'Awaiting quotations')
  const [fileNames, setFileNames] = useState({})
  const [savedAttachmentKeys, setSavedAttachmentKeys] = useState(() => new Set())
  const [amountValues, setAmountValues] = useState({})
  const [formValues, setFormValues] = useState({})
  const [selectedFiles, setSelectedFiles] = useState({})
  const [draftSaving, setDraftSaving] = useState(false)
  const [clearingDraft, setClearingDraft] = useState(false)
  const [quotesSubmitting, setQuotesSubmitting] = useState(false)
  const [formResetKey, setFormResetKey] = useState(0)
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [pendingAction, setPendingAction] = useState('')
  const quotationFormRef = useRef(null)
  const usdInr = useUsdInrRate()

  useEffect(() => {
    let isCurrentRequest = true
    setPreviewAttachment(null)
    if (!requestId) {
      setFileNames({})
      setSavedAttachmentKeys(new Set())
      setAmountValues({})
      setFormValues({})
      setSelectedFiles({})
      return () => { isCurrentRequest = false }
    }
    const storedDraft = readDemoDraft(quotationDraftKey(requestId))
    const hasSavedDraft = storedDraft.explicit === true
    const draft = hasSavedDraft ? storedDraft : {}
    const values = draft.values || {}
    const currentRequest = requests.find((item) => item.requestId === requestId)
    if (!hasSavedDraft) {
      clearDemoDraft(quotationDraftKey(requestId))
      if (currentRequest?.status === 'Pending Travel Desk') {
        clearAttachmentsForRequest(requestId).catch(() => {})
      }
    }
    setFormValues(values)
    setFileNames(draft.fileNames || {})
    setSavedAttachmentKeys(new Set())
    setSelectedFiles({})
    setAmountValues(Object.fromEntries(Object.entries(values).filter(([name]) => name.endsWith('-amount') || name.endsWith('-cost-per-day'))))
    setFormResetKey((key) => key + 1)
    if (hasSavedDraft) getDemoAttachments(requestId).then((attachments) => {
      if (!isCurrentRequest) return
      setSavedAttachmentKeys(new Set(attachments.map((attachment) => attachment.fieldName)))
      setFileNames((current) => ({ ...current, ...Object.fromEntries(attachments.map((attachment) => [attachment.fieldName, attachment.name])) }))
    }).catch(() => {
      if (isCurrentRequest) setSavedAttachmentKeys(new Set())
    })
    return () => { isCurrentRequest = false }
  }, [requestId, requests])

  const deskRequests = useMemo(() => requests.filter((request) => request.lobDecision === 'Approved'), [requests])
  const pendingCount = deskRequests.filter((request) => request.status === 'Pending Travel Desk').length
  const submittedCount = deskRequests.filter((request) => ['Quotations Submitted', 'Quotation Selected', 'Pending Finance Approval', 'Rejected by Finance'].includes(request.status)).length
  const bookingPendingCount = deskRequests.filter((request) => request.status === 'Finance Approved').length
  const bookingCompletedCount = deskRequests.filter((request) => request.status === 'Booking Confirmed').length
  const filteredRequests = useMemo(() => deskRequests.filter((request) => {
    const matchesFilter = activeFilter === 'All requests'
      || (activeFilter === 'Awaiting quotations' && request.status === 'Pending Travel Desk')
      || (activeFilter === 'Quotations submitted' && ['Quotations Submitted', 'Quotation Selected', 'Pending Finance Approval', 'Rejected by Finance'].includes(request.status))
      || (activeFilter === 'Awaiting booking' && request.status === 'Finance Approved')
      || (activeFilter === 'Bookings completed' && request.status === 'Booking Confirmed')
    const searchable = [request.requestId, request['employee-name'], request['employee-id'], request.department, request['from-location'], request['to-location'], request['travel-category']].join(' ').toLowerCase()
    return matchesFilter && searchable.includes(query.trim().toLowerCase())
  }), [activeFilter, deskRequests, query])

  const request = requestId ? requests.find((item) => item.requestId === requestId) : null
  const isEditable = request?.status === 'Pending Travel Desk' && request.lobDecision === 'Approved'
  const hasTravel = request?.['travel-required'] === 'Yes'
  const hasStay = request?.['stay-required'] === 'Yes'
  const currency = getTripCurrency(request?.['travel-type'])
  const cabDays = Number(formValues['estimate-days'] || 0)
  const cabCostPerDay = Number(amountValues['estimate-cost-per-day'] ?? formValues['estimate-cost-per-day'] ?? 0)
  const totalCabAmount = cabDays > 0 && cabCostPerDay > 0 ? Number((cabDays * cabCostPerDay).toFixed(2)) : 0

  function backToQueue() {
    navigate(ROUTES.travelDesk)
  }

  function openRequest(item) {
    if (['Finance Approved', 'Booking Confirmed'].includes(item.status)) {
      navigate(ROUTES.travelDeskBooking.replace(':requestId', encodeURIComponent(item.requestId)))
      return
    }
    setFileNames({})
    setSavedAttachmentKeys(new Set())
    setAmountValues({})
    setFormValues({})
    setSelectedFiles({})
    setFormResetKey((key) => key + 1)
    navigate(ROUTES.travelDeskRequest.replace(':requestId', encodeURIComponent(item.requestId)))
  }

  function clearQuotationDraft() {
    if (!requestId || !isEditable || draftSaving || quotesSubmitting || clearingDraft) return
    setPendingAction('clear')
  }

  async function clearQuotationDraftNow() {
    if (!requestId || !isEditable || draftSaving || quotesSubmitting || clearingDraft) return
    setClearingDraft(true)
    clearDemoDraft(quotationDraftKey(requestId))
    setFileNames({})
    setSavedAttachmentKeys(new Set())
    setAmountValues({})
    setFormValues({})
    setSelectedFiles({})
    setPreviewAttachment(null)
    setFormResetKey((key) => key + 1)
    try {
      await clearAttachmentsForRequest(requestId)
      notify('Unsubmitted quotation draft and its files cleared.', 'success')
    } catch {
      notify('Quotation fields were cleared, but saved files could not be removed.', 'error')
    } finally {
      setPendingAction('')
      setClearingDraft(false)
    }
  }

  function captureQuotationValues(event) {
    if (!requestId || !isEditable) return
    const values = {}
    const draftFileNames = { ...fileNames }
    for (const [name, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value === 'string') values[name] = value
      else if (value.name) draftFileNames[name] = value.name
    }
    setFormValues(values)
    setFileNames(draftFileNames)
    setAmountValues(Object.fromEntries(Object.entries(values).filter(([name]) => name.endsWith('-amount') || name.endsWith('-cost-per-day'))))
  }

  async function saveQuotationDraft() {
    if (!requestId || !isEditable || !quotationFormRef.current || draftSaving) return
    setDraftSaving(true)
    const values = {}
    const draftFileNames = { ...fileNames }
    for (const [name, value] of new FormData(quotationFormRef.current).entries()) {
      if (typeof value === 'string') values[name] = value
      else if (value.name) draftFileNames[name] = value.name
    }
    try {
      await waitForAttachmentCleanup(requestId)
      await Promise.all(Object.entries(selectedFiles).map(([name, file]) => saveDemoAttachment(requestId, name, file)))
      if (!saveDemoDraft(quotationDraftKey(requestId), { explicit: true, savedAt: new Date().toISOString(), values, fileNames: draftFileNames })) {
        throw new Error('Draft could not be saved in browser storage.')
      }
      setFormValues(values)
      setFileNames(draftFileNames)
      setSavedAttachmentKeys((current) => new Set([...current, ...Object.keys(selectedFiles)]))
      setSelectedFiles({})
      setAmountValues(Object.fromEntries(Object.entries(values).filter(([name]) => name.endsWith('-amount') || name.endsWith('-cost-per-day'))))
      notify('Quotation draft saved on this device. You can resume it later.', 'success')
    } catch {
      notify('Draft could not be saved. Your current form is still open; please retry.', 'error')
    } finally {
      setDraftSaving(false)
    }
  }

  function setQueueFilter(filter) {
    setActiveFilter(filter)
    saveDemoDraft(QUEUE_FILTER_KEY, { activeFilter: filter })
  }

  function changeAmount(name, value) {
    setAmountValues((current) => ({ ...current, [name]: value }))
  }

  function changeAttachment(name, file) {
    if (!file || !requestId) return
    setFileNames((current) => ({ ...current, [name]: file.name }))
    setSelectedFiles((current) => ({ ...current, [name]: file }))
  }

  function downloadAttachment(fieldName) {
    downloadDemoAttachment(requestId, fieldName).then((downloaded) => {
      if (!downloaded) notify('This attachment is no longer available in browser storage.', 'error')
    }).catch(() => notify('The saved attachment could not be opened.', 'error'))
  }

  async function viewAttachment(fieldName) {
    const selectedFile = selectedFiles[fieldName]
    if (selectedFile) {
      setPreviewAttachment({ file: selectedFile, name: selectedFile.name, type: selectedFile.type })
      return
    }
    try {
      const attachment = await getDemoAttachment(requestId, fieldName)
      if (!attachment) {
        notify('This attachment is no longer available in browser storage.', 'error')
        return
      }
      setPreviewAttachment(attachment)
    } catch {
      notify('The quotation attachment could not be previewed.', 'error')
    }
  }

  async function submitQuotes(event) {
    event.preventDefault()
    if (!request || !isEditable || quotesSubmitting) return
    setQuotesSubmitting(true)
    const formData = new FormData(event.currentTarget)
    try {
      await waitForAttachmentCleanup(requestId)
      await Promise.all(Object.entries(selectedFiles).map(([name, file]) => saveDemoAttachment(requestId, name, file)))
    const buildQuotedAmount = (amount) => {
      const value = Number(amount)
      return {
        amount: value,
        currency,
        exchangeRate: currency === 'USD' ? usdInr.rate : null,
        exchangeRateDate: currency === 'USD' ? usdInr.date : '',
        amountInr: currency === 'USD' && usdInr.rate ? Number((value * usdInr.rate).toFixed(2)) : null,
      }
    }
    const getFileName = (name) => selectedFiles[name]?.name || fileNames[name] || ''
    const travelQuotes = hasTravel ? [1, 2, 3].map((number) => {
      const prefix = `travel-quote-${number}`
      return { mode: formData.get(`${prefix}-mode`), vendor: formData.get(`${prefix}-vendor`), ...buildQuotedAmount(formData.get(`${prefix}-amount`)), attachmentName: getFileName(`${prefix}-attachment`) }
    }) : []
    const hotelQuotes = hasStay ? [1, 2, 3].map((number) => {
      const prefix = `hotel-quote-${number}`
      return { hotelName: formData.get(`${prefix}-hotel`), roomPlan: formData.get(`${prefix}-room-plan`), ...buildQuotedAmount(formData.get(`${prefix}-amount`)), attachmentName: getFileName(`${prefix}-attachment`) }
    }) : []
    const cabDays = Number(formData.get('estimate-days'))
    const costPerDay = Number(formData.get('estimate-cost-per-day'))
    const totalCabAmount = Number((cabDays * costPerDay).toFixed(2))
    const cabEstimate = hasTravel ? {
      type: formData.get('estimate-type'),
      vendor: formData.get('estimate-vendor'),
      days: cabDays,
      costPerDay,
      ...buildQuotedAmount(totalCabAmount),
    } : null

    const updated = updateDemoRequest(request.requestId, {
      status: 'Quotations Submitted',
      travelDeskQuotes: { cabEstimate, travelQuotes, hotelQuotes },
      travelDeskReviewedBy: DEMO_TRAVEL_DESK.name,
      travelDeskReviewedAt: new Date().toISOString(),
    })
    if (!updated) throw new Error('Request is no longer available.')
    clearDemoDraft(quotationDraftKey(request.requestId))
    setQueueFilter('Quotations submitted')
    setRequests(getDemoRequests())
    notify('Quotations submitted. The employee can now review and select them.', 'success')
    navigate(ROUTES.travelDesk)
    } catch {
      notify('The quotations could not be saved. Your form is still open; please retry.', 'error')
    } finally {
      setQuotesSubmitting(false)
    }
  }

  if (requestId) {
    if (!request || !request.lobDecision || request.lobDecision !== 'Approved') {
      return <div className="travel-desk-page"><div className="desk-empty-state"><span><ClipboardList size={23} /></span><h1>Request not available</h1><p>This request has not reached the Travel Desk queue.</p><button type="button" className="desk-secondary-button" onClick={backToQueue}><ArrowLeft size={15} /> Back to Travel Desk</button></div></div>
    }
    const savedQuotes = request.travelDeskQuotes
    return (
      <div className="travel-desk-page">
        <div className="desk-breadcrumb"><button type="button" onClick={backToQueue}>Travel Desk</button><span>/</span><span>{isEditable ? 'Add quotations' : 'Quotation details'}</span></div>
        <header className="desk-page-heading"><div className="desk-heading-icon"><Plane size={20} /></div><div><p className="desk-eyebrow">TRAVEL DESK · REQUEST {request.requestId}</p><h1>{isEditable ? 'Add travel quotations' : 'Quotation details'}</h1><p>Compare vendor options for the manager-approved business trip.</p></div><button type="button" className="desk-secondary-button" onClick={backToQueue}><ArrowLeft size={15} /> Back to queue</button></header>

        <form ref={quotationFormRef} key={`${requestId}-${formResetKey}`} className="desk-quotation-form" onSubmit={submitQuotes} onChange={captureQuotationValues}>
          <section className="desk-form-section">
            <header className="desk-section-heading"><span className="desk-section-icon"><ClipboardList size={18} /></span><div><p>SECTION · 01</p><h2>Basic information</h2><span>Submitted trip details are shown here for reference.</span></div><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></header>
            <RequestSummary request={request} />
          </section>

          {isEditable && currency === 'USD' && (hasTravel || hasStay) && <FxRateCard rateState={usdInr} onRefresh={usdInr.refresh} />}

          {isEditable && hasTravel && <section className="desk-form-section">
            <header className="desk-section-heading"><span className="desk-section-icon"><CarFront size={18} /></span><div><p>ESTIMATE</p><h2>Cab / taxi estimate</h2><span>Provide the local ground transportation estimate for this trip.</span></div></header>
            <div className="desk-estimate-grid">
              <label className="desk-field"><span>Trip type</span><select name="estimate-type" defaultValue={formValues['estimate-type'] || ''} required><option value="" disabled>Select trip type</option><option>Airport pickup</option><option>Airport drop</option><option>Local city travel</option><option>Outstation / intercity</option><option>Full-day cab</option><option>Other</option></select></label>
              <label className="desk-field"><span>Cab / vendor details</span><input name="estimate-vendor" type="text" placeholder="Vendor name and service details" defaultValue={formValues['estimate-vendor'] || ''} required /></label>
              <MoneyField label="Cost per day" name="estimate-cost-per-day" currency={currency} value={amountValues['estimate-cost-per-day']} rate={usdInr.rate} onChange={changeAmount} />
              <label className="desk-field"><span>No. of days</span><input name="estimate-days" type="number" min="1" step="1" placeholder="Enter days" value={formValues['estimate-days'] ?? ''} required /><small className="desk-field-hint">Enter the chargeable days manually.</small></label>
              <label className="desk-field"><span>Total amount ({currency})</span><span className="desk-money-entry"><span className="desk-currency-input desk-calculated-money"><b>{currency === 'USD' ? '$' : '\u20b9'}</b><input type="text" value={totalCabAmount ? totalCabAmount.toFixed(2) : ''} placeholder="Calculated automatically" readOnly aria-label={`Calculated total cab estimate in ${currency}`} /></span><small className="desk-conversion-caption">Cost per day &times; number of days</small></span></label>
            </div>
          </section>}

          {isEditable && hasTravel && <QuoteSection kind="travel" title="Travel quotations" description={`Add three transport options in ${currency} for the employee and approver to compare.`} icon={<Plane size={18} />} fileNames={fileNames} onFileChange={changeAttachment} savedAttachmentKeys={savedAttachmentKeys} onViewAttachment={viewAttachment} onDownloadAttachment={downloadAttachment} currency={currency} amounts={amountValues} rate={usdInr.rate} onAmountChange={changeAmount} values={formValues} />}
          {isEditable && hasStay && <QuoteSection kind="hotel" title="Hotel quotations" description={`Add three stay options in ${currency} because accommodation is required for this trip.`} icon={<Hotel size={18} />} fileNames={fileNames} onFileChange={changeAttachment} savedAttachmentKeys={savedAttachmentKeys} onViewAttachment={viewAttachment} onDownloadAttachment={downloadAttachment} currency={currency} amounts={amountValues} rate={usdInr.rate} onAmountChange={changeAmount} values={formValues} />}

          {isEditable && !hasTravel && !hasStay && <div className="desk-no-quotes"><CheckCircle2 size={18} /><span>Travel and stay are not required for this request. Complete the Travel Desk review to move it forward.</span></div>}

          {!isEditable && savedQuotes && <>
            <SavedEstimate estimate={savedQuotes.cabEstimate} />
            {savedQuotes.travelQuotes?.length > 0 && <QuoteSection kind="travel" title="Submitted travel quotations" description="Three travel options saved by the Travel Desk." icon={<Plane size={18} />} fileNames={{}} onFileChange={() => {}} existingQuotes={savedQuotes.travelQuotes} onViewAttachment={viewAttachment} onDownloadAttachment={downloadAttachment} currency={currency} amounts={{}} values={{}} />}
            {savedQuotes.hotelQuotes?.length > 0 && <QuoteSection kind="hotel" title="Submitted hotel quotations" description="Three hotel options saved by the Travel Desk." icon={<Hotel size={18} />} fileNames={{}} onFileChange={() => {}} existingQuotes={savedQuotes.hotelQuotes} onViewAttachment={viewAttachment} onDownloadAttachment={downloadAttachment} currency={currency} amounts={{}} values={{}} />}
          </>}

          {isEditable && <div className="desk-demo-note"><FileText size={15} /><span>Use Save draft to keep incomplete quotations on this device. Unsaved changes are discarded when you close the form.</span></div>}
          <footer className="desk-form-actions">{isEditable ? <><button type="button" className="desk-secondary-button" onClick={clearQuotationDraft} disabled={draftSaving || quotesSubmitting}><RotateCcw size={14} /> Clear saved draft</button><button type="button" className="desk-secondary-button" onClick={backToQueue} disabled={draftSaving || quotesSubmitting}><X size={15} /> Close</button><button type="button" className="desk-secondary-button" onClick={saveQuotationDraft} disabled={draftSaving || quotesSubmitting}><FileText size={14} /> {draftSaving ? 'Saving draft…' : 'Save draft'}</button><button type="submit" className="desk-primary-button" disabled={quotesSubmitting || draftSaving}>{quotesSubmitting ? 'Submitting…' : 'Submit quotations'} {!quotesSubmitting && <ArrowRight size={16} />}</button></> : <button type="button" className="desk-secondary-button" onClick={backToQueue}><ArrowLeft size={15} /> Close</button>}</footer>
        </form>
        <ConfirmationDialog open={pendingAction === 'clear'} title="Clear this quotation draft?" message="The quotation fields and locally stored attachments for this request will be removed." confirmLabel="Clear draft" busy={draftSaving || quotesSubmitting || clearingDraft} onConfirm={clearQuotationDraftNow} onCancel={() => setPendingAction('')} />
        <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
      </div>
    )
  }

  const filters = [
    { label: 'Awaiting quotations', count: pendingCount },
    { label: 'Quotations submitted', count: submittedCount },
    { label: 'Awaiting booking', count: bookingPendingCount },
    { label: 'Bookings completed', count: bookingCompletedCount },
    { label: 'All requests', count: deskRequests.length },
  ]

  return (
    <div className="travel-desk-page">
      <div className="desk-breadcrumb"><span>Travel Desk</span><span>/</span><span>Operations queue</span></div>
      <header className="desk-page-heading"><div className="desk-heading-icon"><WalletCards size={20} /></div><div><p className="desk-eyebrow">TRAVEL DESK · OPERATIONS</p><h1>Travel desk requests</h1><p>Prepare quotations and complete Finance-approved travel bookings.</p></div><div className="desk-agent-card"><span><Building2 size={16} /></span><div><small>Travel desk agent</small><strong>{DEMO_TRAVEL_DESK.name}</strong></div></div></header>

      <section className="desk-summary-cards" aria-label="Travel Desk queue summary">
        <div><span className="desk-summary-card-icon desk-pending-icon"><Clock3 size={18} /></span><small>Awaiting quotations</small><strong>{pendingCount}</strong></div>
        <div><span className="desk-summary-card-icon desk-submitted-icon"><CheckCircle2 size={18} /></span><small>Quotations submitted</small><strong>{submittedCount}</strong></div>
        <div><span className="desk-summary-card-icon desk-booking-icon"><CalendarDays size={18} /></span><small>Awaiting booking</small><strong>{bookingPendingCount}</strong></div>
        <div><span className="desk-summary-card-icon"><Plane size={18} /></span><small>Requests from LOB</small><strong>{deskRequests.length}</strong></div>
      </section>

      <section className="desk-queue-card">
        <header className="desk-queue-heading"><div><h2>Travel desk queue</h2><p>Requests move here after LOB approval and return for booking after Finance approval.</p></div><span className="desk-queue-tag"><i /> DEMO QUEUE</span></header>
        <div className="desk-queue-toolbar"><div className="desk-filter-tabs" role="tablist" aria-label="Filter Travel Desk requests">{filters.map(({ label, count }) => <button type="button" key={label} role="tab" aria-selected={activeFilter === label} className={activeFilter === label ? 'active' : ''} onClick={() => setQueueFilter(label)}>{label}<span>{count}</span></button>)}</div><label className="desk-search" htmlFor="desk-request-search"><Search size={15} /><input id="desk-request-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee, destination, request..." /></label></div>

        {filteredRequests.length ? <><div className="desk-table-scroll"><table className="desk-queue-table"><thead><tr><th>Request ID</th><th>Employee</th><th>Department</th><th>Journey</th><th>Travel dates</th><th>Travel / stay</th><th>LOB approved</th><th>Status</th><th>Action</th></tr></thead><tbody>{filteredRequests.map((item) => <tr key={item.requestId}>
          <td className="desk-request-id">{item.requestId}</td>
          <td><strong>{item['employee-name'] || '—'}</strong><small>{item['employee-id'] || 'Employee ID unavailable'}</small></td>
          <td>{item.department || '—'}</td>
          <td><span className="desk-route"><MapPin size={13} />{item['from-location'] || '—'} <i>→</i> {item['to-location'] || '—'}</span><small>{item['travel-category'] || 'Travel category unavailable'}</small></td>
          <td>{formatDate(item['start-date'])}<small>to {formatDate(item['end-date'])} · {item.duration || '—'} days</small></td>
          <td><span>{item['travel-required'] === 'Yes' ? 'Travel' : ''}{item['travel-required'] === 'Yes' && item['stay-required'] === 'Yes' ? ' + ' : ''}{item['stay-required'] === 'Yes' ? 'Stay' : ''}{item['travel-required'] !== 'Yes' && item['stay-required'] !== 'Yes' ? 'No quotes required' : ''}</span></td>
          <td><span className="desk-lob-approved"><CheckCircle2 size={13} />{item.lobReviewedBy || 'LOB approver'}</span></td>
          <td><StatusBadge tone={getRequestStatusTone(item.status)}>{item.status}</StatusBadge></td>
          <td><button type="button" className="desk-open-button" onClick={() => openRequest(item)}>{item.status === 'Pending Travel Desk' ? 'Add quotes' : item.status === 'Finance Approved' ? 'Complete booking' : item.status === 'Booking Confirmed' ? 'View booking' : 'View quotes'} <ArrowRight size={14} /></button></td>
        </tr>)}</tbody></table></div><div className="approval-mobile-list desk-mobile-list">{filteredRequests.map((item) => <article className="approval-mobile-card" key={`mobile-${item.requestId}`}><header><div><strong>{item.requestId}</strong><span>{item['employee-name'] || 'Employee'} · {item['employee-id'] || 'ID unavailable'}</span></div><StatusBadge tone={getRequestStatusTone(item.status)}>{item.status}</StatusBadge></header><div className="approval-mobile-route"><MapPin size={14} />{item['from-location'] || '—'} <i>→</i> {item['to-location'] || '—'}</div><div className="approval-mobile-meta"><span><small>Department / trip purpose</small>{item.department || '—'} · {item['travel-category'] || 'Travel category unavailable'}</span><span><small>Travel dates</small>{formatDate(item['start-date'])} – {formatDate(item['end-date'])} · {item.duration || '—'} days</span><span><small>Requested</small>{[item['travel-required'] === 'Yes' && 'Travel', item['stay-required'] === 'Yes' && 'Stay'].filter(Boolean).join(' + ') || 'No quotes required'}</span><span><small>LOB approval</small>{item.lobReviewedBy || 'LOB approver'}</span></div><footer><button type="button" className="desk-open-button" onClick={() => openRequest(item)}>{item.status === 'Pending Travel Desk' ? 'Add quotes' : item.status === 'Finance Approved' ? 'Complete booking' : item.status === 'Booking Confirmed' ? 'View booking' : 'View quotes'} <ArrowRight size={14} /></button></footer></article>)}</div></> : <div className="desk-empty-state"><span><ClipboardList size={23} /></span><h3>{deskRequests.length ? 'No requests in this view' : 'No requests in the Travel Desk queue'}</h3><p>{deskRequests.length ? 'Try another queue filter or search term.' : 'Requests will arrive here after LOB approval.'}</p></div>}
        <footer className="desk-queue-footer"><span>Requests and quotations are saved in this browser on this device.</span><span>{filteredRequests.length} shown</span></footer>
      </section>
    </div>
  )
}

