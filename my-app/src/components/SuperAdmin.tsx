import { useEffect, useState } from 'react'

type OrganizerItem = {
  id: string
  name: string
  email: string
  organization: string
  iban?: string
  kvk?: string
  btw?: string
  billingContact?: string
  eventsCount?: number
  ticketsSold?: number
  revenueCents?: number
  platformFeeCents?: number
  organizerEarningsCents?: number
}

export default function SuperAdmin() {
  const [items, setItems] = useState<OrganizerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [selected, setSelected] = useState<OrganizerItem | null>(null)
  const [form, setForm] = useState<{ name?: string; email?: string; organization?: string; iban?: string; kvk?: string; btw?: string; billingContact?: string }>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [stats, setStats] = useState<{ organizersCount: number; eventsCount: number; liveEventsCount: number; upcomingEventsCount: number; totalRevenueCents: number; totalTicketsSold: number; platformFeeCents: number; organizerEarningsCents: number } | null>(null)
  const [events, setEvents] = useState<Array<{ id: string; title: string; date: string; status: string; ownerName: string; ownerOrganization: string; capacity: number; ticketsSold: number; redeemedCount: number; revenueCents: number }>>([])

  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [maintenanceResult, setMaintenanceResult] = useState<string | null>(null)

  const runMaintenance = async () => {
    if (!confirm('Dit zal dubbele orders verwijderen en de unieke index herstellen. Zeker weten?')) return
    setMaintenanceLoading(true)
    setMaintenanceResult(null)
    try {
      const res = await fetch('/api/admin/maintenance/db-check', { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (data.ok) {
        setMaintenanceResult(`Succes! Duplicaten gevonden: ${data.result.duplicatesFound}. Verwijderd: ${data.result.removed}. Index actief: ${data.result.indexVerified ? 'JA' : 'NEE'}`)
      } else {
        setMaintenanceResult(`Fout: ${data.error || 'Onbekend'}`)
      }
    } catch (e) {
      setMaintenanceResult(`Netwerkfout: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setMaintenanceLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Check sessiestatus eerst
        const me = await fetch('/api/admin/me', { credentials: 'include' })
        if (!me.ok) {
          setNeedsLogin(true)
          setItems([])
          setLoading(false)
          return
        }
        const [orgRes, statsRes, eventsRes] = await Promise.all([
          fetch('/api/admin/organizers?includeStats=true', { credentials: 'include' }),
          fetch('/api/admin/stats', { credentials: 'include' }),
          fetch('/api/admin/events?upcoming=true', { credentials: 'include' })
        ])
        if (!orgRes.ok) {
          const data = await orgRes.json().catch(() => null)
          setError(data?.message || 'Geen toegang. Log in als superadmin of controleer configuratie.')
          setItems([])
        } else {
          const data = await orgRes.json()
          setItems(data)
        }
        if (statsRes.ok) {
          const s = await statsRes.json()
          setStats(s)
        }
        if (eventsRes.ok) {
          const ev = await eventsRes.json()
          setEvents(ev)
        }
      } catch {
        setError('Fout bij laden van gegevens')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Reageer op auth-veranderingen (login/logout) zonder refresh
  useEffect(() => {
    const handler = async () => {
      setLoading(true)
      setError(null)
      try {
        const me = await fetch('/api/admin/me', { credentials: 'include' })
        if (!me.ok) {
          setNeedsLogin(true)
          setItems([])
          setStats(null)
          setEvents([])
          return
        }
        setNeedsLogin(false)
        const [orgRes, statsRes, eventsRes] = await Promise.all([
          fetch('/api/admin/organizers?includeStats=true', { credentials: 'include' }),
          fetch('/api/admin/stats', { credentials: 'include' }),
          fetch('/api/admin/events?upcoming=true', { credentials: 'include' })
        ])
        if (orgRes.ok) setItems(await orgRes.json()); else setItems([])
        if (statsRes.ok) setStats(await statsRes.json()); else setStats(null)
        if (eventsRes.ok) setEvents(await eventsRes.json()); else setEvents([])
      } catch {
        setError('Fout bij laden van gegevens')
      } finally {
        setLoading(false)
      }
    }
    window.addEventListener('superadmin-auth-changed', handler)
    return () => {
      window.removeEventListener('superadmin-auth-changed', handler)
    }
  }, [])

  const startEdit = (item: OrganizerItem) => {
    setSelected(item)
    setForm({ name: item.name, email: item.email, organization: item.organization, iban: item.iban || '', kvk: item.kvk || '', btw: item.btw || '', billingContact: item.billingContact || '' })
    setMessage(null)
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/organizers/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.message || 'Wijzigen mislukt')
      } else {
        setMessage('Gegevens opgeslagen')
        // ververs lijst lokaal
        setItems(prev => prev.map(it => it.id === selected.id ? { ...it, ...data } : it))
        setSelected(null)
      }
    } catch {
      setMessage('Fout bij opslaan')
    } finally {
      setSaving(false)
    }
  }

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
      // Na succes: lijst opnieuw laden
      setNeedsLogin(false)
      setLoading(true)
      setError(null)
      try {
        const [orgRes, statsRes, eventsRes] = await Promise.all([
          fetch('/api/admin/organizers?includeStats=true', { credentials: 'include' }),
          fetch('/api/admin/stats', { credentials: 'include' }),
          fetch('/api/admin/events?upcoming=true', { credentials: 'include' })
        ])
        if (!orgRes.ok) {
          const d2 = await orgRes.json().catch(() => null)
          setError(d2?.message || 'Geen toegang na login')
          setItems([])
        } else {
          const d2 = await orgRes.json()
          setItems(d2)
        }
        if (statsRes.ok) {
          const s = await statsRes.json()
          setStats(s)
        }
        if (eventsRes.ok) {
          const ev = await eventsRes.json()
          setEvents(ev)
        }
        // Laat de Navbar weten dat de superadmin-auth status is veranderd
        window.dispatchEvent(new Event('superadmin-auth-changed'))
      } finally {
        setLoading(false)
      }
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
        <h1 className="text-2xl font-semibold text-gray-900">Superadmin inloggen</h1>
        <p className="mt-1 text-sm text-gray-600">Voer de superadmin‑email en wachtwoord in zoals ingesteld in de backend‑omgeving.</p>
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
    <div id="dashboard" className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold text-gray-900">SuperAdmin — Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Globale statistieken, schema van events en inkomsten per organisatie.</p>

      {stats && (
        <div className="mt-6 grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Organisaties</div>
            <div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">{stats.organizersCount}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Events totaal</div>
            <div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">{stats.eventsCount}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Live events</div>
            <div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">{stats.liveEventsCount}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Upcoming events</div>
            <div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">{stats.upcomingEventsCount}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 sm:col-span-2 lg:col-span-2">
            <div className="text-sm text-gray-600">Totale omzet</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">€ {(stats.totalRevenueCents / 100).toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Tickets verkocht</div>
            <div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">{stats.totalTicketsSold}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Platform fee</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">€ {(stats.platformFeeCents / 100).toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Systeem Onderhoud Sectie */}
      <div className="mt-8 mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <h2 className="text-lg font-semibold text-yellow-900">Systeem Onderhoud</h2>
        <p className="mt-1 text-sm text-yellow-800">
          Gebruik deze knop als gebruikers dubbele e-mails ontvangen of als de database consistentie gecontroleerd moet worden.
          Dit verwijdert duplicaten en forceert de unieke index.
        </p>
        <div className="mt-4">
          <button
            onClick={runMaintenance}
            disabled={maintenanceLoading}
            className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            {maintenanceLoading ? 'Bezig...' : 'Repareer Database & Indexen'}
          </button>
          {maintenanceResult && (
            <div className="mt-2 p-3 bg-white border border-yellow-200 rounded text-sm font-mono text-gray-800">
              {maintenanceResult}
            </div>
          )}
        </div>
      </div>

      {events.length > 0 && (
        <div id="events" className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Schema — Upcoming events</h2>
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
      )}

      <div id="organizers" className="mt-6 overflow-x-auto overflow-y-auto max-h-96 rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase">Organisatie</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase">Omzet</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase">Inkomsten</th>
              <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2">
                  <div className="font-medium text-gray-900">{item.organization}</div>
                  <div className="text-sm text-gray-600">{item.name}</div>
                </td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700">{item.email}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700">€ {((item.revenueCents || 0) / 100).toFixed(2)}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700">{item.ticketsSold || 0}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700">€ {((item.platformFeeCents || 0) / 100).toFixed(2)}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700">€ {((item.organizerEarningsCents || 0) / 100).toFixed(2)}</td>
                <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-right">
                  <button onClick={() => startEdit(item)} className="inline-flex rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700">Bewerk</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="mt-8 rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Bewerk: {selected.organization}</h2>
          <p className="mt-1 text-sm text-gray-600">Alleen superadmin kan deze velden wijzigen.</p>
          {message && <div className="mt-2 text-sm text-gray-900">{message}</div>}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-gray-700">Naam</span>
              <input className="mt-1 w-full rounded-md border-gray-300" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">Email</span>
              <input className="mt-1 w-full rounded-md border-gray-300" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm text-gray-700">Organisatie</span>
              <input className="mt-1 w-full rounded-md border-gray-300" value={form.organization || ''} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">IBAN</span>
              <input className="mt-1 w-full rounded-md border-gray-300" value={form.iban || ''} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">KVK</span>
              <input className="mt-1 w-full rounded-md border-gray-300" value={form.kvk || ''} onChange={e => setForm(f => ({ ...f, kvk: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">BTW (NL)</span>
              <input className="mt-1 w-full rounded-md border-gray-300" value={form.btw || ''} onChange={e => setForm(f => ({ ...f, btw: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">Factuurcontact</span>
              <input className="mt-1 w-full rounded-md border-gray-300" value={form.billingContact || ''} onChange={e => setForm(f => ({ ...f, billingContact: e.target.value }))} />
            </label>
            {/* KVK-verificatieoptie verwijderd */}
          </div>

          <div className="mt-6 flex gap-3">
            <button disabled={saving} onClick={save} className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">Opslaan</button>
            <button onClick={() => setSelected(null)} className="inline-flex rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300">Annuleren</button>
          </div>
        </div>
      )}
    </div>
  )
}
