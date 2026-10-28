import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, CircleHelp, Plane, RotateCcw, UserRound, X } from 'lucide-react'
import { ROUTES } from '../routes/paths.js'
import { useToast } from '../context/useToast.js'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { saveDemoRequest } from '../utils/demoRequests.js'
import { clearDemoDraft, readDemoDraft, saveDemoDraft } from '../utils/demoDrafts.js'
import { DEMO_MANAGER } from '../constants/demoUsers.js'
import { useDemoAuth } from '../context/DemoAuthContext.jsx'

const REQUEST_DRAFT_KEY = 'traveldesk-new-request-draft'

const demoEmployee = {
  name: 'Demo Traveler',
  employeeId: 'TD-2048',
  email: 'demo@netlink.com',
  department: 'Operations',
  level: 'L3',
  manager: DEMO_MANAGER.name,
}

const options = {
  travelType: ['Domestic', 'International'],
  billable: ['Billable', 'Non-billable'],
  category: ['Business meeting', 'Conference', 'Client visit', 'Training', 'Site visit', 'Internal meeting', 'Other'],
  yesNo: ['Yes', 'No'],
}

function TextField({ label, id, type = 'text', placeholder, defaultValue, helper, icon: Icon, ...inputProps }) {
  return (
    <label className="request-field" htmlFor={id}>
      <span>{label}</span>
      <span className="request-control-wrap">{Icon ? <Icon size={16} aria-hidden="true" /> : null}<input id={id} name={id} type={type} placeholder={placeholder} defaultValue={defaultValue} {...inputProps} /></span>
      {helper && <small className="request-field-helper">{helper}</small>}
    </label>
  )
}

function SelectField({ label, id, choices, value, onChange }) {
  return (
    <label className="request-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} name={id} value={value ?? ''} onChange={onChange} required><option value="" disabled>Select {label.toLowerCase()}</option>{choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select>
    </label>
  )
}

function FormSection({ number, title, description, icon: Icon, children }) {
  return (
    <section className="request-section">
      <header className="request-section-heading"><span className="request-section-icon">{Icon ? <Icon size={18} /> : null}</span><div><span className="request-section-number">SECTION {number}</span><h2>{title}</h2><p>{description}</p></div></header>
      <div className="request-fields">{children}</div>
    </section>
  )
}

export function TravelRequestPage() {
  const navigate = useNavigate()
  const notify = useToast()
  const { user } = useDemoAuth()
  const [draftValues, setDraftValues] = useState(() => readDemoDraft(REQUEST_DRAFT_KEY))
  const [startDate, setStartDate] = useState(() => readDemoDraft(REQUEST_DRAFT_KEY)['start-date'] || '')
  const [endDate, setEndDate] = useState(() => readDemoDraft(REQUEST_DRAFT_KEY)['end-date'] || '')
  const [formResetKey, setFormResetKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [pendingAction, setPendingAction] = useState('')
  const duration = calculateDuration(startDate, endDate)

  function saveRequestDraft(event) {
    const form = event.currentTarget.form || event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setDraftValues(values)
    if (event.target.name === 'start-date') setStartDate(event.target.value)
    if (event.target.name === 'end-date') setEndDate(event.target.value)
    if (!saveDemoDraft(REQUEST_DRAFT_KEY, values)) notify('Your form could not autosave. Check browser storage or use Save/Submit again.', 'error')
  }

  function submitRequest(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const requestValues = Object.fromEntries(new FormData(event.currentTarget))
    requestValues.duration = duration || ''
    try {
      const savedRequest = saveDemoRequest(requestValues)
      if (!savedRequest) throw new Error('The request was not saved.')
      clearDemoDraft(REQUEST_DRAFT_KEY)
      notify('Demo travel request submitted and saved in this browser.', 'success')
      navigate(ROUTES.requests)
    } catch {
      notify('The request could not be saved in this browser. Your form is still open; please retry.', 'error')
      setSubmitting(false)
    }
  }

  function clearRequestDraft() {
    if (submitting) return
    if (!Object.keys(draftValues).length) {
      clearRequestDraftNow()
      return
    }
    setPendingAction('clear')
  }

  function clearRequestDraftNow() {
    clearDemoDraft(REQUEST_DRAFT_KEY)
    setDraftValues({})
    setStartDate('')
    setEndDate('')
    setFormResetKey((key) => key + 1)
    notify('Unsubmitted travel request draft cleared.', 'success')
    setPendingAction('')
  }

  function closeRequestForm() {
    if (submitting) return
    if (Object.keys(draftValues).length) {
      setPendingAction('close')
      return
    }
    navigate(ROUTES.welcome)
  }

  function discardAndClose() {
    clearDemoDraft(REQUEST_DRAFT_KEY)
    setPendingAction('')
    navigate(ROUTES.welcome)
  }

  return (
    <div className="request-page">
      <div className="request-breadcrumb"><button type="button" onClick={closeRequestForm}>Home</button><span>/</span><span>New travel request</span></div>
      <div className="request-page-heading"><div><span className="request-page-icon"><Plane size={20} /></span><div><p className="request-eyebrow">TRAVEL DESK · REQUESTS</p><h1>New travel request</h1><p className="request-page-description">Share your trip details to start planning your business journey.</p></div></div><button type="button" className="request-back-button" onClick={closeRequestForm}><ArrowLeft size={15} /> Back to home</button></div>

      <form key={formResetKey} className="travel-request-form" onSubmit={submitRequest}>
        <FormSection number="01" title="Basic information" description="Your employee details for this request." icon={UserRound}>
          <TextField label="Employee name" id="employee-name" defaultValue={draftValues['employee-name'] ?? (user?.name || demoEmployee.name)} required onChange={saveRequestDraft} />
          <TextField label="Employee ID" id="employee-id" defaultValue={draftValues['employee-id'] ?? (user?.id || demoEmployee.employeeId)} required onChange={saveRequestDraft} />
          <TextField label="Email address" id="employee-email" type="email" defaultValue={draftValues['employee-email'] ?? (user?.email || demoEmployee.email)} required onChange={saveRequestDraft} />
          <TextField label="Department" id="department" defaultValue={draftValues.department ?? demoEmployee.department} required onChange={saveRequestDraft} />
          <TextField label="Employee level" id="employee-level" defaultValue={draftValues['employee-level'] ?? demoEmployee.level} required onChange={saveRequestDraft} />
          <TextField label="Reporting manager" id="reporting-manager" defaultValue={draftValues['reporting-manager'] ?? demoEmployee.manager} readOnly required onChange={saveRequestDraft} />
          <SelectField label="Travel type" id="travel-type" choices={options.travelType} value={draftValues['travel-type']} onChange={saveRequestDraft} />
          <SelectField label="Billable / Non-Billable" id="billing-type" choices={options.billable} value={draftValues['billing-type']} onChange={saveRequestDraft} />
        </FormSection>

        <FormSection number="02" title="Travel details" description="Add the route and timing for your trip." icon={CalendarDays}>
          <SelectField label="Travel category" id="travel-category" choices={options.category} value={draftValues['travel-category']} onChange={saveRequestDraft} />
          <TextField label="From location" id="from-location" placeholder="Enter departure city or location" defaultValue={draftValues['from-location']} required onChange={saveRequestDraft} />
          <TextField label="To location" id="to-location" placeholder="Enter destination city or location" defaultValue={draftValues['to-location']} required onChange={saveRequestDraft} />
          <TextField label="Start date" id="start-date" type="date" value={startDate} required onChange={saveRequestDraft} />
          <TextField label="End date" id="end-date" type="date" min={startDate || undefined} value={endDate} required onChange={saveRequestDraft} />
          <TextField label="Duration" id="duration" value={duration ? `${duration} ${duration === 1 ? 'day' : 'days'}` : ''} placeholder="Calculated from trip dates" helper="Calendar days, including both selected dates." readOnly />
          <SelectField label="Travel required" id="travel-required" choices={options.yesNo} value={draftValues['travel-required']} onChange={saveRequestDraft} />
          <SelectField label="Stay required" id="stay-required" choices={options.yesNo} value={draftValues['stay-required']} onChange={saveRequestDraft} />
          <label className="request-field request-reason" htmlFor="purpose-of-travel"><span>Purpose of travel</span><textarea id="purpose-of-travel" name="purpose-of-travel" rows="4" placeholder="Briefly describe the purpose of your trip" defaultValue={draftValues['purpose-of-travel']} required maxLength={500} onChange={saveRequestDraft} /></label>
        </FormSection>

        <div className="request-note"><CircleHelp size={16} /><span>Draft autosaves in this browser for refresh recovery. Closing this form clears it. Submitting saves the demo request locally, not in Lumenore.</span></div>
        <div className="request-form-actions"><button type="button" className="request-cancel-button" onClick={clearRequestDraft} disabled={submitting}><RotateCcw size={14} /> Clear form</button><button type="button" className="request-cancel-button" onClick={closeRequestForm} disabled={submitting}><X size={15} /> Close</button><button type="submit" className="request-submit-button" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit request'} {!submitting && <ArrowRight size={16} />}</button></div>
      </form>
      <ConfirmationDialog open={Boolean(pendingAction)} title={pendingAction === 'clear' ? 'Clear this request form?' : 'Discard this request draft?'} message={pendingAction === 'clear' ? 'All entered information will be removed from the form and its saved draft.' : 'Your autosaved travel request draft will be deleted and the form will close.'} confirmLabel={pendingAction === 'clear' ? 'Clear form' : 'Discard and close'} busy={submitting} onConfirm={pendingAction === 'clear' ? clearRequestDraftNow : discardAndClose} onCancel={() => !submitting && setPendingAction('')} />
    </div>
  )
}

function calculateDuration(start, end) {
  if (!start || !end || end < start) return ''
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay)
  return Math.floor((endUtc - startUtc) / 86_400_000) + 1
}
