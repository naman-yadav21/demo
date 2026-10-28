import { createElement, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, CalendarDays, CheckCircle2, ClipboardCheck, Download, Eye, FileText, Hotel, MapPin, Plane, RotateCcw, Save, Upload, UserRound, X } from 'lucide-react'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'
import { AttachmentPreviewDialog } from '../components/ui/AttachmentPreviewDialog.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { DEMO_TRAVEL_DESK } from '../constants/demoUsers.js'
import { useToast } from '../context/useToast.js'
import { ROUTES } from '../routes/paths.js'
import { clearDemoDraft, readDemoDraft, saveDemoDraft } from '../utils/demoDrafts.js'
import { deleteDemoAttachment, downloadDemoAttachment, getDemoAttachment, getDemoAttachments, saveDemoAttachment } from '../utils/demoAttachments.js'
import { getDemoRequests, updateDemoRequest } from '../utils/demoRequests.js'
import { getRequestStatusTone } from '../utils/requestStatus.js'

const bookingDraftKey = (requestId) => `traveldesk-booking-draft:${requestId}`
const BOOKING_ATTACHMENT_FIELDS = ['booking-ticket', 'booking-hotel-voucher']

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatAmount(value, currency = 'INR') {
  if (value == null || value === '') return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value))
}

function ReadonlyField({ label, value }) {
  return <div className="booking-readonly-field"><span>{label}</span><strong>{value || '—'}</strong></div>
}

function SelectedQuoteCard({ title, icon, option, attachmentField, onView, onDownload }) {
  return <article className="booking-selected-quote">
    <header><span>{createElement(icon, { size: 16 })}</span><div><small>EMPLOYEE SELECTED</small><h3>{title}</h3></div><CheckCircle2 size={16} className="booking-selected-check" /></header>
    {option ? <>
      <div className="booking-quote-main"><strong>{option.mode || option.hotelName || title}</strong><span>{option.vendor || option.roomPlan || 'Selected quotation'}</span></div>
      <div className="booking-quote-cost"><span>Approved quotation</span><strong>{formatAmount(option.amount, option.currency || 'INR')}</strong>{option.currency === 'USD' && option.amountInr != null && <small>Approx. {formatAmount(option.amountInr, 'INR')} at quotation rate</small>}</div>
      {option.attachmentName ? <div className="booking-quote-attachment"><FileText size={14} /><span>{option.attachmentName}</span><button type="button" onClick={() => onView(attachmentField)} aria-label={`View ${title} quotation`}><Eye size={14} /> View</button><button type="button" onClick={() => onDownload(attachmentField)} aria-label={`Download ${title} quotation`}><Download size={14} /> Download</button></div> : <p className="booking-no-file">No quotation attachment was uploaded.</p>}
    </> : <p className="booking-no-file">No employee-selected option is available for this service.</p>}
  </article>
}

function BookingAttachment({ field, label, fileName, saved, selected, onChange, onView, onDownload, required, readOnly = false }) {
  return <div className="booking-upload-field">
    <span className="booking-field-label">{label}{required && <i>Required</i>}</span>
    {selected && <div className="booking-selected-file"><span><FileText size={14} /><strong>{selected.name}</strong><small>Ready to upload</small></span><button type="button" onClick={() => onView(field)} aria-label={`Preview selected ${label}`}><Eye size={13} /> Preview</button></div>}
    {saved && fileName && !selected && <div className="booking-current-file"><span><FileText size={14} />{fileName}</span><button type="button" onClick={() => onView(field)} aria-label={`View ${label}`}><Eye size={13} /> View</button><button type="button" onClick={() => onDownload(field)} aria-label={`Download ${label}`}><Download size={13} /> Download</button></div>}
    {!readOnly && <><label className="booking-file-picker"><Upload size={15} /><span>{selected?.name || (saved ? 'Choose a replacement file' : 'Choose a PDF or image')}</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" required={required && !saved} onChange={(event) => onChange(field, event.target.files?.[0] || null)} /></label><small>PDF, JPG, PNG or WEBP · maximum 10 MB</small></>}
    {readOnly && !saved && <small className="booking-missing-file">No saved file was found in browser storage.</small>}
  </div>
}

export function TravelBookingPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const notify = useToast()
  const [requests, setRequests] = useState(() => getDemoRequests())
  const [values, setValues] = useState({ ticketReference: '', carrier: '', hotelDetails: '', hotelConfirmation: '' })
  const [fileNames, setFileNames] = useState({})
  const [savedAttachmentFields, setSavedAttachmentFields] = useState(() => new Set())
  const [selectedFiles, setSelectedFiles] = useState({})
  const [savingDraft, setSavingDraft] = useState(false)
  const [clearingDraft, setClearingDraft] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [formError, setFormError] = useState('')
  const [pendingAction, setPendingAction] = useState('')

  const request = requests.find((item) => item.requestId === requestId)
  const selectedTravel = request?.travelDeskQuotes?.travelQuotes?.[request?.selectedQuoteOptions?.travel]
  const selectedHotel = request?.travelDeskQuotes?.hotelQuotes?.[request?.selectedQuoteOptions?.hotel]
  const requiresTravel = request?.['travel-required'] === 'Yes'
  const requiresStay = request?.['stay-required'] === 'Yes'
  const canBook = request?.status === 'Finance Approved'
  const isBooked = request?.status === 'Booking Confirmed'
  useEffect(() => {
    let isCurrentRequest = true
    const draft = readDemoDraft(bookingDraftKey(requestId))
    const hasExplicitDraft = draft.explicit === true
    const savedValues = hasExplicitDraft ? draft.values || {} : {}
    const booking = request?.bookingDetails || {}
    setValues(isBooked ? {
      ticketReference: booking.ticketReference || '',
      carrier: booking.carrier || '',
      hotelDetails: booking.hotelDetails || '',
      hotelConfirmation: booking.hotelConfirmation || '',
    } : {
      ticketReference: savedValues.ticketReference || '',
      carrier: savedValues.carrier || selectedTravel?.vendor || '',
      hotelDetails: savedValues.hotelDetails || '',
      hotelConfirmation: savedValues.hotelConfirmation || '',
    })
    setFileNames(isBooked ? { 'booking-ticket': request?.ticket || '', 'booking-hotel-voucher': request?.['hotel-voucher'] || '' } : hasExplicitDraft ? draft.fileNames || {} : {})
    setSelectedFiles({})
    setPreviewAttachment(null)
    setFormError('')

    if (hasExplicitDraft || isBooked) {
      getDemoAttachments(requestId).then((attachments) => {
        if (!isCurrentRequest) return
        const bookingAttachments = attachments.filter((attachment) => BOOKING_ATTACHMENT_FIELDS.includes(attachment.fieldName))
        setSavedAttachmentFields(new Set(bookingAttachments.map((attachment) => attachment.fieldName)))
        if (hasExplicitDraft) setFileNames((current) => ({ ...current, ...Object.fromEntries(bookingAttachments.map((attachment) => [attachment.fieldName, attachment.name])) }))
      }).catch(() => {
        if (isCurrentRequest) setSavedAttachmentFields(new Set())
      })
    } else setSavedAttachmentFields(new Set())

    return () => { isCurrentRequest = false }
  }, [isBooked, request, requestId, selectedTravel?.vendor])

  function changeValue(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFormError('')
  }

  function chooseFile(field, file) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Each booking attachment must be 10 MB or smaller.')
      return
    }
    setSelectedFiles((current) => ({ ...current, [field]: file }))
    setFileNames((current) => ({ ...current, [field]: file.name }))
    setFormError('')
  }

  async function viewAttachment(field) {
    const selectedFile = selectedFiles[field]
    if (selectedFile) {
      setPreviewAttachment({ file: selectedFile, name: selectedFile.name, type: selectedFile.type })
      return
    }
    try {
      const attachment = await getDemoAttachment(requestId, field)
      if (!attachment) {
        notify('This attachment is no longer available in browser storage.', 'error')
        return
      }
      setPreviewAttachment(attachment)
    } catch {
      notify('The attachment could not be previewed.', 'error')
    }
  }

  async function downloadAttachment(field) {
    try {
      if (!await downloadDemoAttachment(requestId, field)) notify('This attachment is no longer available in browser storage.', 'error')
    } catch {
      notify('The attachment could not be downloaded.', 'error')
    }
  }

  function closeBooking() {
    if (canBook && (Object.values(values).some((value) => value.trim()) || Object.keys(selectedFiles).length)) {
      setPendingAction('close')
      return
    }
    navigate(ROUTES.travelDesk)
  }

  function clearBookingDraft() {
    if (!canBook || savingDraft || submitting || clearingDraft) return
    setPendingAction('clear')
  }

  async function clearBookingDraftNow() {
    if (!canBook || savingDraft || submitting || clearingDraft) return
    setClearingDraft(true)
    try {
      await Promise.all(BOOKING_ATTACHMENT_FIELDS.map((field) => deleteDemoAttachment(requestId, field)))
      clearDemoDraft(bookingDraftKey(requestId))
    } catch {
      notify('The saved booking files could not all be removed. Please retry.', 'error')
      return
    } finally {
      setClearingDraft(false)
    }
    setValues({ ticketReference: '', carrier: selectedTravel?.vendor || '', hotelDetails: '', hotelConfirmation: '' })
    setFileNames({})
    setSavedAttachmentFields(new Set())
    setSelectedFiles({})
    setFormError('')
    notify('Saved booking draft cleared.', 'success')
    setPendingAction('')
  }

  async function saveBookingDraft() {
    if (!canBook || savingDraft) return
    setSavingDraft(true)
    try {
      await Promise.all(Object.entries(selectedFiles).map(([field, file]) => saveDemoAttachment(requestId, field, file)))
      const nextSavedFields = new Set([...savedAttachmentFields, ...Object.keys(selectedFiles)])
      const nextFileNames = { ...fileNames }
      if (!saveDemoDraft(bookingDraftKey(requestId), { explicit: true, values, fileNames: nextFileNames, savedAt: new Date().toISOString() })) throw new Error('Draft could not be saved.')
      setSavedAttachmentFields(nextSavedFields)
      setSelectedFiles({})
      notify('Booking draft saved. You can resume it later.', 'success')
    } catch {
      notify('Booking draft could not be saved. Your form is still open; please retry.', 'error')
    } finally {
      setSavingDraft(false)
    }
  }

  function requestBookingConfirmation(event) {
    event.preventDefault()
    if (!canBook || submitting || pendingAction) return
    if (requiresTravel && (!values.ticketReference.trim() || !values.carrier.trim() || (!savedAttachmentFields.has('booking-ticket') && !selectedFiles['booking-ticket']))) {
      setFormError('Add the ticket reference, airline or provider, and ticket attachment before confirming.')
      return
    }
    if (requiresStay && (!values.hotelDetails.trim() || (!savedAttachmentFields.has('booking-hotel-voucher') && !selectedFiles['booking-hotel-voucher']))) {
      setFormError('Add the hotel details and voucher attachment before confirming.')
      return
    }

    setPendingAction('book')
  }

  async function confirmBooking() {
    if (!canBook || submitting || pendingAction !== 'book') return
    setSubmitting(true)
    try {
      await Promise.all(Object.entries(selectedFiles).map(([field, file]) => saveDemoAttachment(requestId, field, file)))
      const ticketName = requiresTravel ? fileNames['booking-ticket'] || selectedFiles['booking-ticket']?.name || '' : ''
      const voucherName = requiresStay ? fileNames['booking-hotel-voucher'] || selectedFiles['booking-hotel-voucher']?.name || '' : ''
      const updated = updateDemoRequest(requestId, {
        status: 'Booking Confirmed',
        ticket: ticketName,
        'hotel-voucher': voucherName,
        bookingDetails: { ...values },
        bookingConfirmedBy: DEMO_TRAVEL_DESK.name,
        bookingConfirmedAt: new Date().toISOString(),
      })
      if (!updated) throw new Error('Request is no longer available.')
      clearDemoDraft(bookingDraftKey(requestId))
      setRequests(getDemoRequests())
      notify('Booking details confirmed and saved with this request.', 'success')
      setPendingAction('')
      navigate(ROUTES.travelDesk)
    } catch {
      notify('Booking details could not be saved. Your form is still open; please retry.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!request || !request.lobDecision || request.lobDecision !== 'Approved' || (!canBook && !isBooked)) {
    return <div className="travel-booking-page"><div className="booking-unavailable"><span><ClipboardCheck size={23} /></span><h1>Booking is not available</h1><p>This request must be approved by Finance before the Travel Desk can confirm bookings.</p><button type="button" className="booking-secondary-button" onClick={closeBooking}><ArrowLeft size={15} /> Back to Travel Desk</button></div></div>
  }

  const tripFields = [
    ['Employee', request['employee-name'], UserRound], ['Employee ID', request['employee-id']], ['Department', request.department, Building2],
    ['Email', request['employee-email']], ['Travel type', request['travel-type']], ['Travel category', request['travel-category']],
    ['From', request['from-location'], MapPin], ['To', request['to-location'], MapPin],
    ['Start date', formatDate(request['start-date']), CalendarDays], ['End date', formatDate(request['end-date']), CalendarDays],
    ['Duration', request.duration ? `${request.duration} ${Number(request.duration) === 1 ? 'day' : 'days'}` : '—'],
    ['Purpose', request['purpose-of-travel']],
  ]

  return <div className="travel-booking-page">
    <div className="booking-breadcrumb"><button type="button" onClick={closeBooking}>Travel Desk</button><span>/</span><span>{isBooked ? 'Booking details' : 'Complete booking'}</span></div>
    <header className="booking-page-heading"><span className="booking-page-icon"><Plane size={21} /></span><div><p className="booking-eyebrow">TRAVEL DESK · REQUEST {request.requestId}</p><h1>{isBooked ? 'Travel booking details' : 'Complete travel booking'}</h1><p>{isBooked ? 'Review the booking references and travel documents for this request.' : 'Use the Finance-approved options to record tickets and accommodation.'}</p></div><div className="booking-agent"><span><Building2 size={16} /></span><div><small>Travel desk agent</small><strong>{DEMO_TRAVEL_DESK.name}</strong></div></div></header>

    <section className="booking-status-strip"><div><span className="booking-status-icon"><CheckCircle2 size={17} /></span><div><strong>{isBooked ? 'Booking confirmed' : 'Finance approved · ready to book'}</strong><p>{isBooked ? `Confirmed by ${request.bookingConfirmedBy || DEMO_TRAVEL_DESK.name}${request.bookingConfirmedAt ? ` on ${formatDate(request.bookingConfirmedAt.slice(0, 10))}` : ''}.` : 'The employee-selected quotations have Finance approval. Add the booking references and documents below.'}</p></div></div><StatusBadge tone={getRequestStatusTone(request.status)}>{request.status}</StatusBadge></section>

    <section className="booking-card booking-trip-card"><header className="booking-card-heading"><span><ClipboardCheck size={17} /></span><div><h2>Travel request</h2><p>Request details and trip schedule</p></div><strong className="booking-request-number">{request.requestId}</strong></header><div className="booking-trip-grid">{tripFields.map(([label, value, Icon]) => <div className="booking-trip-field" key={label}><span>{Icon && <Icon size={13} />}{label}</span><strong>{value || '—'}</strong></div>)}</div></section>

    <section className="booking-selected-section"><div className="booking-section-title"><div><p>APPROVED QUOTATIONS</p><h2>Employee-selected options</h2></div><span>Finance approved</span></div><div className="booking-selected-grid">
      {requiresTravel && <SelectedQuoteCard title="Travel option" icon={Plane} option={selectedTravel} attachmentField={`travel-quote-${Number(request.selectedQuoteOptions?.travel) + 1}-attachment`} onView={viewAttachment} onDownload={downloadAttachment} />}
      {requiresStay && <SelectedQuoteCard title="Stay option" icon={Hotel} option={selectedHotel} attachmentField={`hotel-quote-${Number(request.selectedQuoteOptions?.hotel) + 1}-attachment`} onView={viewAttachment} onDownload={downloadAttachment} />}
      {!requiresTravel && !requiresStay && <div className="booking-no-services"><CheckCircle2 size={17} />No ticket or accommodation was requested. Complete the Travel Desk confirmation below.</div>}
    </div></section>

    {isBooked ? <section className="booking-card booking-completed-card"><header className="booking-card-heading"><span><CheckCircle2 size={17} /></span><div><h2>Booking information</h2><p>Ticket and accommodation references saved by Travel Desk</p></div></header><div className="booking-completed-grid">
      {requiresTravel && <div className="booking-completed-service"><div><Plane size={16} /><strong>Travel booking</strong></div><ReadonlyField label="PNR / ticket reference" value={values.ticketReference} /><ReadonlyField label="Airline / provider" value={values.carrier} /><BookingAttachment field="booking-ticket" label="Ticket / e-ticket" fileName={fileNames['booking-ticket']} saved={savedAttachmentFields.has('booking-ticket')} onView={viewAttachment} onDownload={downloadAttachment} readOnly /></div>}
      {requiresStay && <div className="booking-completed-service"><div><Hotel size={16} /><strong>Stay booking</strong></div><ReadonlyField label="Hotel details" value={values.hotelDetails} /><ReadonlyField label="Confirmation reference" value={values.hotelConfirmation || '—'} /><BookingAttachment field="booking-hotel-voucher" label="Hotel voucher" fileName={fileNames['booking-hotel-voucher']} saved={savedAttachmentFields.has('booking-hotel-voucher')} onView={viewAttachment} onDownload={downloadAttachment} readOnly /></div>}
    </div></section> : <form className="booking-card booking-form-card" onSubmit={requestBookingConfirmation}>
      <header className="booking-card-heading"><span><FileText size={17} /></span><div><h2>Add booking information</h2><p>Enter booking references and attach the ticket or voucher.</p></div><span className="booking-draft-tag">Draft stays on this device</span></header>
      <div className="booking-form-grid">
        {requiresTravel && <section className="booking-service-form"><header><span><Plane size={16} /></span><div><h3>Travel booking</h3><p>Ticket details for the approved journey</p></div><span className="booking-required-chip">Required</span></header>
          <div className="booking-fields-grid"><label className="booking-field"><span>PNR / ticket reference <i>Required</i></span><input name="ticketReference" value={values.ticketReference} onChange={changeValue} placeholder="Enter PNR or ticket reference" required /></label><label className="booking-field"><span>Airline / booking provider <i>Required</i></span><input name="carrier" value={values.carrier} onChange={changeValue} placeholder="Airline or travel provider" required /></label>
            <BookingAttachment field="booking-ticket" label="Ticket / e-ticket" fileName={fileNames['booking-ticket']} saved={savedAttachmentFields.has('booking-ticket')} selected={selectedFiles['booking-ticket']} onChange={chooseFile} onView={viewAttachment} onDownload={downloadAttachment} required />
          </div></section>}
        {requiresStay && <section className="booking-service-form"><header><span><Hotel size={16} /></span><div><h3>Stay booking</h3><p>Property details and accommodation voucher</p></div><span className="booking-required-chip">Required</span></header>
          <div className="booking-fields-grid"><label className="booking-field"><span>Hotel details <i>Required</i></span><textarea name="hotelDetails" value={values.hotelDetails} onChange={changeValue} rows="3" placeholder="Hotel name, address or check-in details" required /></label><label className="booking-field"><span>Hotel confirmation reference <small>Optional</small></span><input name="hotelConfirmation" value={values.hotelConfirmation} onChange={changeValue} placeholder="Enter hotel confirmation number" /></label>
            <BookingAttachment field="booking-hotel-voucher" label="Hotel voucher" fileName={fileNames['booking-hotel-voucher']} saved={savedAttachmentFields.has('booking-hotel-voucher')} selected={selectedFiles['booking-hotel-voucher']} onChange={chooseFile} onView={viewAttachment} onDownload={downloadAttachment} required />
          </div></section>}
      </div>
      {formError && <p className="booking-form-error" role="alert">{formError}</p>}
      <div className="booking-form-note"><FileText size={14} /><span>Use Save draft to keep incomplete booking details. Closing without saving discards unsaved changes.</span></div>
      <footer className="booking-form-actions"><button type="button" className="booking-secondary-button" onClick={closeBooking} disabled={savingDraft || submitting || clearingDraft}><X size={14} /> Close</button><button type="button" className="booking-secondary-button booking-clear-button" onClick={clearBookingDraft} disabled={savingDraft || submitting || clearingDraft}><RotateCcw size={14} /> Clear saved draft</button><button type="button" className="booking-secondary-button" onClick={saveBookingDraft} disabled={savingDraft || submitting || clearingDraft}><Save size={14} /> {savingDraft ? 'Saving draft…' : 'Save draft'}</button><button type="submit" className="booking-primary-button" disabled={savingDraft || submitting || clearingDraft}>{submitting ? 'Confirming…' : 'Confirm booking'} {!submitting && <ArrowRight size={15} />}</button></footer>
      <ConfirmationDialog open={Boolean(pendingAction)} title={pendingAction === 'book' ? 'Confirm this booking?' : pendingAction === 'clear' ? 'Clear the saved booking draft?' : 'Close this booking form?'} message={pendingAction === 'book' ? 'The ticket and hotel documents will be saved to this request and shown to the employee.' : pendingAction === 'clear' ? 'The saved form values and booking attachments will be deleted from this device.' : 'Unsaved changes will be discarded. Previously saved drafts remain on this device.'} confirmLabel={pendingAction === 'book' ? 'Confirm booking' : pendingAction === 'clear' ? 'Clear draft' : 'Close form'} busy={savingDraft || submitting || clearingDraft} onConfirm={pendingAction === 'book' ? confirmBooking : pendingAction === 'clear' ? clearBookingDraftNow : () => { setPendingAction(''); navigate(ROUTES.travelDesk) }} onCancel={() => !savingDraft && !submitting && !clearingDraft && setPendingAction('')} />
    </form>}
    <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
  </div>
}
