function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function ApprovalRequestDetails({ request }) {
  const details = [
    ['Employee', request['employee-name']], ['Employee ID', request['employee-id']],
    ['Department / level', [request.department, request['employee-level']].filter(Boolean).join(' · ')],
    ['Email', request['employee-email']], ['Travel type', request['travel-type']],
    ['Bill / Unbill', request['billing-type']], ['Travel category', request['travel-category']],
    ['From', request['from-location']], ['To', request['to-location']],
    ['Start date', formatDate(request['start-date'])], ['End date', formatDate(request['end-date'])],
    ['Duration', request.duration], ['Travel required', request['travel-required']],
    ['Stay required', request['stay-required']], ['Purpose of travel', request['purpose-of-travel']],
  ]

  return <dl className="approval-detail-grid">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
}
