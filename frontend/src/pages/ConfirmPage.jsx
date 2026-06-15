import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { contactsApi } from '../lib/api'

export function ConfirmPage() {
  const { userId, contactId, vote } = useParams()
  const [state, setState] = useState({ loading: true, success: false, name: '', message: '' })

  useEffect(() => {
    contactsApi
      .confirm(userId, contactId, vote)
      .then((result) => {
        setState({
          loading: false,
          success: true,
          name: result.contact?.name || '',
          message: `Your response has been recorded. Thank you for supporting this verification flow.`
        })
      })
      .catch((error) => {
        setState({
          loading: false,
          success: false,
          name: '',
          message: error.message
        })
      })
  }, [userId, contactId, vote])

  return (
    <div className="confirm-page">
      <div className="glass-panel confirm-card">
        {state.loading ? (
          <p>Recording your response...</p>
        ) : state.success ? (
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
