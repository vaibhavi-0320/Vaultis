export function CardSkeleton({ tall = false }) {
  return (
    <div className={`skeleton-card ${tall ? 'tall' : ''}`}>
      <div className="skeleton-line wide" />
      <div className="skeleton-line medium" />
      <div className="skeleton-line short" />
    </div>
  )
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      {action}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="empty-state" role="alert">
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {onRetry ? (
        <button type="button" className="button ghost rounded" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}
