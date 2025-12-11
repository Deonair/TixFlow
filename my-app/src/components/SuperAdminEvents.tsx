import { useEffect, useState } from 'react'

type EventRow = {
  id: string
  title: string
  date: string
  status: string
  ownerName: string
  ownerOrganization: string
  capacity: number
  ticketsSold: number
  redeemedCount: number
  revenueCents: number
}

export default function SuperAdminEvents() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [onlyUpcoming, setOnlyUpcoming] = useState(true)

  const fetchEvents = async (upcoming: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const me = await fetch('/api/admin/me', { credentials: 'include' })
      if (!me.ok) {
        setNeedsLogin(true)
        setEvents([])
        setLoading(false)
        return
      }
      const url = upcoming ? '/api/admin/events?upcoming=true' : '/api/admin/events'
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.message || 'Geen toegang. Log in als superadmin of controleer configuratie.')
        setEvents([])
      } else {
        const data = await res.json()
        setEvents(data)
      }
    } catch {
      setError('Fout bij laden van gegevens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents(onlyUpcoming) }, [onlyUpcoming])

  const login = async () => {
    setLoginLoading(true)
    setLoginError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setLoginError(data?.message || 'Ongeldige superadmin‑gegevens')
        return
      }
      setNeedsLogin(false)
      fetchEvents(onlyUpcoming)
    } catch {
      setLoginError('Fout bij inloggen')
    } finally {
      setLoginLoading(false)
    }
  }

  if (loading) return <div className="text-gray-700">Laden…</div>
  if (needsLogin) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900">SuperAdmin — Events</h1>
        <p className="mt-1 text-sm text-gray-600">Log in om evenementenstatistieken te bekijken.</p>
        {loginError && <div className="mt-2 text-sm text-red-600">{loginError}</div>}
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm text-gray-700">Email</span>
            <input type="email" className="mt-1 w-full rounded-md border-gray-300" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm text-gray-700">Wachtwoord</span>
            <input type="password" className="mt-1 w-full rounded-md border-gray-300" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
          </label>
          <button disabled={loginLoading || !loginEmail || !loginPassword} onClick={login} className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
            {loginLoading ? 'Bezig…' : 'Inloggen'}
          </button>
        </div>
      </div>
    )
  }
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-gray-900">SuperAdmin — Events</h1>
      <p className="mt-1 text-sm text-gray-600">Overzicht van evenementen met basisstatistieken.</p>

      <div className="mt-4 flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={onlyUpcoming} onChange={e => { setOnlyUpcoming(e.target.checked); fetchEvents(e.target.checked) }} />
          Alleen aankomend
        </label>
      </div>

      <div className="mt-3 overflow-x-auto overflow-y-auto max-h-96 rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase">Organisatie</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-right text-xs font-medium text-gray-500 uppercase">Capaciteit</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-right text-xs font-medium text-gray-500 uppercase">Verkocht</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-right text-xs font-medium text-gray-500 uppercase">Redeemed</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-right text-xs font-medium text-gray-500 uppercase">Omzet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map(ev => (
              <tr key={ev.id}>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700">{new Date(ev.date).toLocaleString()}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-900 font-medium">{ev.title}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700">{ev.ownerOrganization}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-right text-gray-700">{ev.capacity}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-right text-gray-700">{ev.ticketsSold}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-right text-gray-700">{ev.redeemedCount}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-right text-gray-700">€ {(ev.revenueCents / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
