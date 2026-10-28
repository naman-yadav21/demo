export function Select({ label, id, options = [], ...props }) {
  return <label className="field-label" htmlFor={id}>{label}<select id={id} className="text-input" {...props}><option value="">Select an option</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}
