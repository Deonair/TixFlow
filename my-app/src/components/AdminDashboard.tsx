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

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    const total = events.length
    const upcoming = events.filter(e => {
      const dt = new Date(e.date)
      return !isNaN(dt.getTime()) && dt.getTime() >= Date.now()
    }).length
    const live = events.filter(e => {
      const dt = new Date(e.date)
      return e.status === 'published' && !isNaN(dt.getTime()) && dt.getTime() >= Date.now()
    }).length
    return { total, upcoming, live }
  }, [events])

  // Bepaal het eerstvolgende opkomende event (datum in de toekomst, dichtstbij)
  const nextEvent = useMemo(() => {
    const now = Date.now()
    return events
      .filter(e => {
        const dt = new Date(e.date)
        return !isNaN(dt.getTime()) && dt.getTime() >= now
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  }, [events])

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
                  <Link
                    to={`/event/${nextEvent.slug}`}
                    className="text-sm inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                  >
                    Publieke pagina
                  </Link>
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