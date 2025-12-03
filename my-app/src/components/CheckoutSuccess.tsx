import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const CheckoutSuccess = () => {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const confirm = async () => {
      if (!sessionId) return
      setStatus('processing')
      try {
        const res = await fetch(`/api/payments/confirm/${encodeURIComponent(sessionId)}`)
        const data = await res.json()
        if (!res.ok) {
          setMessage(data?.error ? String(data.error) : 'Kon bestelling niet bevestigen')
          setStatus('error')
          return
        }
        setMessage('Je bestelling is bevestigd. Tickets zijn verzonden indien mogelijk.')
        setStatus('done')
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Onbekende fout')
        setStatus('error')
      }
    }
    confirm()
  }, [sessionId])
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold text-gray-900">Betaling geslaagd</h1>
        <p className="mt-2 text-sm text-gray-600">Bedankt voor je aankoop! Je order wordt bevestigd.</p>
        {sessionId && (
          <p className="mt-2 text-xs text-gray-500">Session ID: {sessionId}</p>
        )}
        {status === 'processing' && (
          <p className="mt-2 text-sm text-gray-600">Bevestigen… Even geduld aub.</p>
        )}
        {message && (
          <p className={`mt-2 text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>{message}</p>
        )}
        <div className="mt-4">
          <Link to="/" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700">Naar home</Link>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSuccess
