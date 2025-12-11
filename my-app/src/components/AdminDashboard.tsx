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
  // Recente orders worden niet meer op dashboard getoond; alleen op detailpagina
  // const [latestOrders, setLatestOrders] = useState<Array<{ _id: string; customerEmail: string; amountTotal: number; createdAt: string }>>([])
  const [overallStats, setOverallStats] = useState<{ revenueCents: number; ticketsSold: number; ordersCount: number } | null>(null)
  // Check-in UI state
  const [checkToken, setCheckToken] = useState('')
  const [checkInfo, setCheckInfo] = useState<null | { ok: boolean; message?: string; ticketTypeName?: string; redeemed?: boolean; eventTitle?: string; eventId?: string }>(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null)
  const [isCheckinOpen, setIsCheckinOpen] = useState(false)
  const [justRedeemed, setJustRedeemed] = useState(false) // nieuw

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
      const isActive = (e.status ?? 'active') === 'active'
      return isActive && !isNaN(dt.getTime()) && isSameDay(dt, now)
    }).length
    const upcoming = events.filter(e => {
      const dt = new Date(e.date)
      const isActive = (e.status ?? 'active') === 'active'
      return isActive && !isNaN(dt.getTime()) && dt.getTime() > now.getTime() && !isSameDay(dt, now)
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
        const isActive = (e.status ?? 'active') === 'active'
        return isActive && !isNaN(dt.getTime()) && dt.getTime() > now.getTime() && !isSameDay(dt, now)
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
      const isActive = (e.status ?? 'active') === 'active'
      return isActive && !isNaN(dt.getTime()) && isSameDay(dt, now)
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

  // Haal statistieken op voor live event (geen orders meer)
  useEffect(() => {
    let cancelled = false
    const fetchExtra = async () => {
      if (!liveEvent?._id) {
        if (!cancelled) {
          setLiveStats(null)
        }
        return
      }
      try {
        const statsRes = await fetch(`/api/stats/event/${liveEvent._id}`)
        if (statsRes.ok) {
          const s = await statsRes.json()
          if (!cancelled) setLiveStats({ revenueCents: s.revenueCents ?? 0, ticketsSold: s.ticketsSold ?? 0, ordersCount: s.ordersCount ?? 0 })
        } else if (!cancelled) {
          setLiveStats(null)
        }
      } catch {
        if (!cancelled) {
          setLiveStats(null)
        }
      }
    }
    fetchExtra()
    return () => { cancelled = true }
  }, [liveEvent?._id])

  const verifyTicket = async () => {
    setCheckLoading(true)
    setRedeemMessage(null)
    setJustRedeemed(false) // nieuw: reset bij (her)verifiëren
    try {
      const res = await fetch(`/api/tickets/verify?token=${encodeURIComponent(checkToken)}`)
      const data = await res.json()
      if (!res.ok) {
        setCheckInfo({ ok: false, message: data?.message || 'Ticket niet gevonden' })
      } else {
        const eventIdResp = typeof data.eventId === 'string' ? data.eventId : undefined
        const belongsToLive = liveEvent?._id && eventIdResp ? String(liveEvent._id) === String(eventIdResp) : true
        if (!belongsToLive) {
          setCheckInfo({ ok: false, message: 'Ticket hoort niet bij het live event', eventId: eventIdResp })
        } else {
          setCheckInfo({ ok: true, ticketTypeName: data.ticketTypeName, redeemed: data.redeemed, eventTitle: data.event?.title, eventId: eventIdResp })
        }
      }
    } catch {
      setCheckInfo({ ok: false, message: 'Fout bij verificatie' })
    } finally {
      setCheckLoading(false)
    }
  }

  const redeemTicket = async () => {
    setCheckLoading(true)
    try {
      // Strikte controle: alleen inchecken als ticket bij live event hoort
      if (liveEvent?._id && checkInfo?.eventId && String(liveEvent._id) !== String(checkInfo.eventId)) {
        setRedeemMessage('Ticket hoort niet bij dit live event')
        setCheckLoading(false)
        return
      }
      const res = await fetch('/api/tickets/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: checkToken })
      })
      const data = await res.json()
      if (!res.ok || data?.ok === false) {
        setRedeemMessage(data?.message || 'Kon ticket niet inchecken')
        setCheckInfo(prev => prev ? { ...prev, redeemed: prev.redeemed ?? false } : prev)
      } else {
        setRedeemMessage('Ticket ingecheckt')
        setJustRedeemed(true) // nieuw: markeer als net ingecheckt
        setCheckInfo(prev => prev ? { ...prev, redeemed: true } : prev)
      }
    } catch {
      setRedeemMessage('Fout bij inchecken')
    } finally {
      setCheckLoading(false)
    }
  }

  const closeCheckin = () => {
    setIsCheckinOpen(false)
    setCheckToken('')
    setCheckInfo(null)
    setRedeemMessage(null)
    setCheckLoading(false)
    setJustRedeemed(false) // nieuw: reset bij sluiten
  }

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
      try { document.execCommand('copy') } catch { console.warn('Clipboard fallback copy mislukt') }
      document.body.removeChild(ta)
    }

    setCopiedSlug(slug)
    setTimeout(() => {
      setCopiedSlug(prev => (prev === slug ? null : prev))
    }, 1500)
  }

  return (
    <>
      <section className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="w-full sm:w-auto grid grid-cols-2 gap-2 sm:gap-3 sm:auto-cols-max">
            <button
              onClick={() => navigate('/admin/event/new')}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 sm:px-4 sm:py-2.5"
            >
              Nieuw event
            </button>
            <Link
              to="/admin/events"
              className="inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-900 hover:bg-gray-100 sm:px-4 sm:py-2.5"
            >
              Bekijk alle events
            </Link>
          </div>
        </div>

        {/* KPI kaarten */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="text-sm text-gray-500">Totaal events</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="text-sm text-gray-500">Komend</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.upcoming}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="text-sm text-gray-500">Live</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.live}</div>
          </div>
        </div>

        {overallStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <div className="text-sm text-gray-500">Totale omzet (betaald)</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">€ {(overallStats.revenueCents / 100).toFixed(2)}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <div className="text-sm text-gray-500">Tickets verkocht (totaal)</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">{overallStats.ticketsSold}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
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
              <div key={liveEvent._id} className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{liveEvent.title}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(liveEvent.date).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}
                      {liveEvent.location ? ` · ${liveEvent.location}` : ''}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full sm:max-w-xs">
                    <Link
                      to={`/admin/event/${liveEvent._id}`}
                      className="text-sm inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-2 py-1.5 text-gray-900 hover:bg-gray-100 w-full"
                    >
                      Details
                    </Link>
                    <Link
                      to={`/admin/event/${liveEvent._id}/edit`}
                      className="text-sm inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-2 py-1.5 text-gray-900 hover:bg-gray-100 w-full"
                    >
                      Bewerken
                    </Link>
                    {liveEvent.slug ? (
                      <button
                        type="button"
                        onClick={() => copyPublicUrl(liveEvent.slug!)}
                        className="text-sm inline-flex items-center justify-center rounded-lg bg-blue-600 px-2 py-1.5 text-white hover:bg-blue-700 w-full"
                      >
                        Publieke pagina
                      </button>
                    ) : (
                      <div className="hidden sm:block" />
                    )}
                    <button
                      type="button"
                      onClick={() => setIsCheckinOpen(true)}
                      className="text-sm inline-flex items-center justify-center rounded-lg bg-green-600 px-2 py-1.5 text-white hover:bg-green-700 w-full"
                    >
                      Check-in
                    </button>
                    {copiedSlug === liveEvent.slug && (
                      <span className="col-span-2 text-center text-xs text-green-600">Gekopieerd!</span>
                    )}
                  </div>
                </div>

                {liveStats && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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

                {/* Check-in sectie: verplaatst naar popup */}
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
              <div key={nextEvent._id} className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium text-gray-900">{nextEvent.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(nextEvent.date).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}
                    {nextEvent.location ? ` · ${nextEvent.location}` : ''}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full sm:max-w-xs">
                  <Link
                    to={`/admin/event/${nextEvent._id}`}
                    className="text-sm inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-2 py-1.5 text-gray-900 hover:bg-gray-100 w-full"
                  >
                    Details
                  </Link>
                  <Link
                    to={`/admin/event/${nextEvent._id}/edit`}
                    className="text-sm inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-2 py-1.5 text-gray-900 hover:bg-gray-100 w-full"
                  >
                    Bewerken
                  </Link>
                  {nextEvent.slug ? (
                    <button
                      type="button"
                      onClick={() => copyPublicUrl(nextEvent.slug!)}
                      className="text-sm inline-flex items-center justify-center rounded-lg bg-blue-600 px-2 py-1.5 text-white hover:bg-blue-700 w-full"
                    >
                      Publieke pagina
                    </button>
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                  {copiedSlug === nextEvent.slug && (
                    <span className="col-span-2 text-center text-xs text-green-600">Gekopieerd!</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      {isCheckinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeCheckin}
          />
          <div className="relative z-50 w-[92vw] max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Check-in</h3>
                {liveEvent && (
                  <div className="text-xs text-gray-600">{liveEvent?.title}</div>
                )}
              </div>
              <button
                type="button"
                onClick={closeCheckin}
                className="text-sm inline-flex items-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-900 hover:bg-gray-100"
              >
                Sluiten
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              {/* Camera placeholder */}
              <div className="h-40 sm:h-56 w-full rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                Camera placeholder
              </div>
              {/* Ticketcode invoer */}
              <div>
                <input
                  value={checkToken}
                  onChange={e => setCheckToken(e.target.value)}
                  placeholder="Ticketcode"
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm text-gray-900"
                />
              </div>
              {/* Actieknoppen: altijd twee naast elkaar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={verifyTicket}
                  disabled={checkLoading || !checkToken}
                  className="text-sm inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-2 py-1.5 text-gray-900 hover:bg-gray-100 disabled:opacity-50 w-full"
                >
                  Verifieer
                </button>
                <button
                  type="button"
                  onClick={redeemTicket}
                  disabled={checkLoading || !(checkInfo && checkInfo.ok && !checkInfo.redeemed)}
                  className="text-sm inline-flex items-center justify-center rounded-lg bg-green-600 px-2 py-1.5 text-white hover:bg-green-700 disabled:opacity-50 w-full"
                >
                  Check-in
                </button>
              </div>
              <div className="text-sm">
                {checkInfo ? (
                  <div className={checkInfo?.ok ? 'text-gray-800' : 'text-red-600'}>
                    {checkInfo?.ok ? (
                      <>
                        <span>{checkInfo?.ticketTypeName || 'Ticket'}</span>
                        {checkInfo?.redeemed && !justRedeemed ? ( // aangepast
                          <span className="ml-2 text-orange-600">(al ingecheckt)</span>
                        ) : null}
                        {checkInfo?.eventTitle ? <span className="ml-2 text-gray-500">– {checkInfo?.eventTitle}</span> : null}
                      </>
                    ) : (
                      <span>{checkInfo?.message || 'Niet gevonden'}</span>
                    )}
                  </div>
                ) : null}
                {redeemMessage && <div className="mt-1 text-gray-800">{redeemMessage}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminDashboard
