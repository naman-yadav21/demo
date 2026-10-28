export function getRequestStatusTone(status = '') {
  if (status.startsWith('Pending')) return 'warning'
  if (status === 'Finance Approved' || status === 'Booking Confirmed' || status.startsWith('Approved') || status.startsWith('Quotations') || status === 'Quotation Selected') return 'success'
  return 'error'
}
