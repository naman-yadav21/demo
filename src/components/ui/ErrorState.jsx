export function ErrorState({ title = 'Something went wrong', description = 'Please try again later.' }) {
  return <div className="state-panel error-panel" role="alert"><span className="state-icon">!</span><h2>{title}</h2><p>{description}</p></div>
}
