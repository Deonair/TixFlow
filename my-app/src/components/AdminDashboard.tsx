import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type TicketType = { name: string; price: number; capacity: number }
type EventItem = {
  _id: string
  title: string
  date: string
  location?: string
  description?: string
  slug?: string
  status?: string
  ticketTypes?: TicketType[]
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [liveStats, setLiveStats] = useState<{ revenueCents: number; ticketsSold: number; ordersCount: number } | null>(null)
  const [latestOrders, setLatestOrders] = useState<Array<{ _id: string; customerEmail: string; amountTotal: number; createdAt: string }>>([])
  const [overallStats, setOverallStats] = useState<{ revenueCents: number; ticketsSold: number; ordersCount: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/events')
        if (!res.ok) throw new Error('Kon events niet laden')
        const data = await res.json()
        if (!cancelled) setEvents(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()

    const total = events.length
    const live = events.filter(e => {
      const dt = new Date(e.date)
      return !isNaN(dt.getTime()) && isSameDay(dt, now)
    }).length
    const upcoming = events.filter(e => {
      const dt = new Date(e.date)
      return !isNaN(dt.getTime()) && dt.getTime() > now.getTime() && !isSameDay(dt, now)
    }).length
    return { total, upcoming, live }
  }, [events])

  // Haal totale omzet/tickets/orders op door per-event stats te aggregeren
  useEffect(() => {
    let cancelled = false
    const fetchAllStats = async () => {
      if (!events || events.length === 0) {
        if (!cancelled) setOverallStats(null)
        return
      }
      try {
        const results = await Promise.allSettled(
          events.map(e => fetch(`/api/stats/event/${e._id}`).then(r => r.ok ? r.json() : null))
        )
        let revenueCents = 0
        let ticketsSold = 0
        let ordersCount = 0
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value) {
            revenueCents += r.value.revenueCents ?? 0
            ticketsSold += r.value.ticketsSold ?? 0
            ordersCount += r.value.ordersCount ?? 0
          }
        })
        if (!cancelled) setOverallStats({ revenueCents, ticketsSold, ordersCount })
      } catch {
        if (!cancelled) setOverallStats(null)
      }
    }
    fetchAllStats()
    return () => { cancelled = true }
  }, [events])

  // Bepaal het eerstvolgende opkomende event (datum in de toekomst, dichtstbij)
  const nextEvent = useMemo(() => {
    const now = new Date()
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    return events
      .filter(e => {
        const dt = new Date(e.date)
        return !isNaN(dt.getTime()) && dt.getTime() > now.getTime() && !isSameDay(dt, now)
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  }, [events])

  // Bepaal het (meest relevante) live event van vandaag
  const liveEvent = useMemo(() => {
    const now = new Date()
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()

    const todayEvents = events.filter(e => {
      const dt = new Date(e.date)
      return !isNaN(dt.getTime()) && isSameDay(dt, now)
    })

    if (todayEvents.length === 0) return undefined

    const upcomingToday = todayEvents
      .filter(e => new Date(e.date).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (upcomingToday.length > 0) return upcomingToday[0]

    // Als alles al begonnen is vandaag, toon het meest recente (laatste) event van vandaag
    return todayEvents
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }, [events])

  // Haal statistieken en recente orders op voor live event
  useEffect(() => {
    let cancelled = false
    const fetchExtra = async () => {
      if (!liveEvent?._id) {
        if (!cancelled) {
          setLiveStats(null)
          setLatestOrders([])
        }
        return
      }
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch(`/api/stats/event/${liveEvent._id}`),
          fetch(`/api/orders?eventId=${liveEvent._id}&limit=5`),
        ])
        if (statsRes.ok) {
          const s = await statsRes.json()
          if (!cancelled) setLiveStats({ revenueCents: s.revenueCents ?? 0, ticketsSold: s.ticketsSold ?? 0, ordersCount: s.ordersCount ?? 0 })
        } else if (!cancelled) {
          setLiveStats(null)
        }
        if (ordersRes.ok) {
          const o = await ordersRes.json()
          const slim = Array.isArray(o) ? o.map((x: any) => ({ _id: String(x._id), customerEmail: x.customerEmail, amountTotal: x.amountTotal, createdAt: x.createdAt })) : []
          if (!cancelled) setLatestOrders(slim)
        } else if (!cancelled) {
          setLatestOrders([])
        }
      } catch {
        if (!cancelled) {
          setLiveStats(null)
          setLatestOrders([])
        }
      }
    }
    fetchExtra()
    return () => { cancelled = true }
  }, [liveEvent?._id])

  const copyPublicUrl = async (slug?: string): Promise<void> => {
    if (!slug) return
    const url = `${window.location.origin}/event/${slug}`

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { }
      document.body.removeChild(ta)
    }

    setCopiedSlug(slug)
    setTimeout(() => {
      setCopiedSlug(prev => (prev === slug ? null : prev))
    }, 1500)
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/event/new')}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700"
          >
            Nieuw event
          </button>
          <Link
            to="/admin/events"
            className="inline-flex items-center rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-gray-900 hover:bg-gray-100"
          >
            Bekijk alle events
          </Link>
        </div>
      </div>

      {/* KPI kaarten */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Totaal events</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Komend</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.upcoming}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Live</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.live}</div>
        </div>
      </div>

      {overallStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="text-sm text-gray-500">Totale omzet (betaald)</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">€ {(overallStats.revenueCents / 100).toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="text-sm text-gray-500">Tickets verkocht (totaal)</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{overallStats.ticketsSold}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="text-sm text-gray-500">Bestellingen (totaal)</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{overallStats.ordersCount}</div>
          </div>
        </div>
      )}

      {/* Live event */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Live event</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {loading && (
            <div className="p-5 text-gray-600">Laden...</div>
          )}
          {!loading && error && (
            <div className="p-5 text-red-600">{error}</div>
          )}
          {!loading && !error && !liveEvent && (
            <div className="p-5 text-gray-600">Geen live event</div>
          )}
          {!loading && !error && liveEvent && (
            <div key={liveEvent._id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{liveEvent.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(liveEvent.date).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}
                    {liveEvent.location ? ` · ${liveEvent.location}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/admin/event/${liveEvent._id}`}
                    className="text-sm inline-flex items-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-900 hover:bg-gray-100"
                  >
                    Details
                  </Link>
                  <Link
                    to={`/admin/event/${liveEvent._id}/edit`}
                    className="text-sm inline-flex items-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-900 hover:bg-gray-100"
                  >
                    Bewerken
                  </Link>
                  {liveEvent.slug && (
                    <>
                      <button
                        type="button"
                        onClick={() => copyPublicUrl(liveEvent.slug)}
                        className="text-sm inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                      >
                        Publieke pagina
                      </button>
                      {copiedSlug === liveEvent.slug && (
                        <span className="text-xs text-green-600">Gekopieerd!</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {liveStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Omzet</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">€ {(liveStats.revenueCents / 100).toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Tickets verkocht</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{liveStats.ticketsSold}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Bestellingen</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{liveStats.ordersCount}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Recente orders</div>
                <a
                  href={`/api/orders/export?eventId=${liveEvent._id}`}
                  className="text-sm inline-flex items-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-900 hover:bg-gray-100"
                >
                  Exporteer CSV
                </a>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                {latestOrders.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600">Geen bestellingen</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {latestOrders.map(o => (
                      <li key={o._id} className="px-4 py-3 flex items-center justify-between">
                        <div className="text-sm text-gray-800">{o.customerEmail}</div>
                        <div className="text-sm font-medium text-gray-900">€ {(o.amountTotal / 100).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Eerstvolgend event */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Eerstvolgend event</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {loading && (
            <div className="p-5 text-gray-600">Laden...</div>
          )}
          {!loading && error && (
            <div className="p-5 text-red-600">{error}</div>
          )}
          {!loading && !error && !nextEvent && (
            <div className="p-5 text-gray-600">Geen opkomend event</div>
          )}
          {!loading && !error && nextEvent && (
            <div key={nextEvent._id} className="p-5 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{nextEvent.title}</div>
                <div className="text-sm text-gray-600">
                  {new Date(nextEvent.date).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}
                  {nextEvent.location ? ` · ${nextEvent.location}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/admin/event/${nextEvent._id}`}
                  className="text-sm inline-flex items-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-900 hover:bg-gray-100"
                >
                  Details
                </Link>
                <Link
                  to={`/admin/event/${nextEvent._id}/edit`}
                  className="text-sm inline-flex items-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-900 hover:bg-gray-100"
                >
                  Bewerken
                </Link>
                {nextEvent.slug && (
                  <>
                    <button
                      type="button"
                      onClick={() => copyPublicUrl(nextEvent.slug)}
                      className="text-sm inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                    >
                      Publieke pagina
                    </button>
                    {copiedSlug === nextEvent.slug && (
                      <span className="text-xs text-green-600">Gekopieerd!</span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default AdminDashboard
