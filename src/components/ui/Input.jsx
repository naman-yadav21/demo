export function Input({ label, id, ...props }) {
  return <label className="field-label" htmlFor={id}>{label}<input id={id} className="text-input" {...props} /></label>
}
