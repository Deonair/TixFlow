import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

type TicketData = {
  ok: boolean
  redeemed: boolean
  ticketTypeName: string
  attendeeEmail: string
  eventId: string
  event: {
    title: string
    location: string
    date: string
    slug: string
  } | null
}

export default function TicketVerify() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TicketData | null>(null)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemedNow, setRedeemedNow] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Geen token gevonden.')
      setLoading(false)
      return
    }

    fetch(`/api/tickets/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.message || 'Ongeldig ticket')
        }
        return res.json()
      })
      .then((d: TicketData) => {
        setData(d)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [token])

  const handleRedeem = async () => {
    if (!token) return
    if (!confirm('Weet je zeker dat je dit ticket wilt inchecken?')) return

    setRedeemLoading(true)
    try {
      const res = await fetch('/api/tickets/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.message || 'Kon ticket niet inchecken')
      }
      setRedeemedNow(true)
      setData(prev => prev ? { ...prev, redeemed: true } : null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fout bij inchecken')
    } finally {
      setRedeemLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
            <span className="sr-only">Laden...</span>
          </div>
          <p className="mt-2 text-gray-600">Ticket verifiëren...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-xl font-bold text-red-800 mb-2">Ongeldig Ticket</h1>
          <p className="text-red-600">{error}</p>
          <div className="mt-6">
            <Link to="/" className="text-sm font-medium text-red-700 hover:text-red-800 underline">
              Terug naar home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const isRedeemed = data.redeemed || redeemedNow

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden border-t-4 ${isRedeemed ? 'border-yellow-500' : 'border-green-500'}`}>
        <div className="p-6 text-center border-b border-gray-100">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isRedeemed ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
            {isRedeemed ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {isRedeemed ? 'Reeds gebruikt' : 'Geldig Ticket'}
          </h1>
          <p className={`text-sm font-medium ${isRedeemed ? 'text-yellow-600' : 'text-green-600'}`}>
            {isRedeemed ? 'Dit ticket is al ingecheckt.' : 'Ticket is geldig voor toegang.'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</label>
            <p className="text-lg font-medium text-gray-900">{data.event?.title || 'Onbekend event'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Datum</label>
              <p className="text-gray-900">
                {data.event?.date ? new Date(data.event.date).toLocaleDateString('nl-NL') : '-'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Locatie</label>
              <p className="text-gray-900 truncate">{data.event?.location || '-'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
                <p className="text-gray-900 font-medium">{data.ticketTypeName}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Bezoeker</label>
                <p className="text-gray-900 truncate" title={data.attendeeEmail}>{data.attendeeEmail}</p>
              </div>
            </div>
          </div>
        </div>

        {!isRedeemed && (
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <button
              onClick={handleRedeem}
              disabled={redeemLoading}
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {redeemLoading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-[2px] border-current border-t-transparent text-white rounded-full mr-2"></span>
                  Verwerken...
                </>
              ) : (
                'Inchecken'
              )}
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">
          Terug naar TixFlow
        </Link>
      </div>
    </div>
  )
}
