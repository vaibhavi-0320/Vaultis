import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'

export function ConfirmPage() {
  const { vote } = useParams()
  const [searchParams] = useSearchParams()

  const state = useMemo(() => {
    const success = searchParams.get('success') === 'true'
    const name = searchParams.get('name') || ''
    const error = searchParams.get('error') || ''
    return {
      success,
      name,
      message: success
        ? 'Your response has been recorded. Thank you for supporting this verification flow.'
        : error || 'This confirmation link is invalid or has expired.'
    }
  }, [searchParams])

  return (
    <div className="confirm-page">
      <div className="glass-panel confirm-card">
        {state.success ? (
          <>
            {vote === 'confirmed' ? <CheckCircle2 size={38} className="success-icon" /> : <XCircle size={38} className="warning-icon" />}
            <h1>{vote === 'confirmed' ? 'Status Confirmed' : 'Status Denied'}</h1>
            <p>{state.message}</p>
            {state.name ? <span>Contact: {state.name}</span> : null}
          </>
        ) : (
          <>
            <XCircle size={38} className="warning-icon" />
            <h1>Unable to process confirmation</h1>
            <p>{state.message}</p>
          </>
        )}
      </div>
    </div>
  )
}
