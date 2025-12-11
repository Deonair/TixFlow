import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Event {
  _id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  slug?: string;
  ticketTypes?: { name: string; price: number; capacity: number }[];
}

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyTimeoutId, setCopyTimeoutId] = useState<number | null>(null);
  const [stats, setStats] = useState<{
    revenueCents: number;
    ticketsSold: number;
    ordersCount: number;
    attendance?: number;
    capacityTotal?: number;
    remaining?: number;
    percentFilled?: number;
  } | null>(null)
  const [orders, setOrders] = useState<Array<{ _id: string; customerEmail: string; amountTotal: number; createdAt: string }>>([])

  const isObjectId = /^[a-fA-F0-9]{24}$/.test(id || '');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          throw new Error('Event niet gevonden');
        }
        const data = await response.json();
        setEvent(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  // Haal statistieken en recente orders voor dit event op
  useEffect(() => {
    let cancelled = false
    const fetchStatsAndOrders = async () => {
      if (!id) return
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch(`/api/stats/event/${id}`),
          fetch(`/api/orders?eventId=${id}&limit=5`),
        ])
        if (statsRes.ok) {
          const s = await statsRes.json()
          if (!cancelled) setStats({
            revenueCents: s.revenueCents ?? 0,
            ticketsSold: s.ticketsSold ?? 0,
            ordersCount: s.ordersCount ?? 0,
            attendance: s.attendance ?? 0,
            capacityTotal: s.capacityTotal ?? 0,
            remaining: s.remaining ?? undefined,
            percentFilled: s.percentFilled ?? undefined,
          })
        } else if (!cancelled) {
          setStats(null)
        }
        if (ordersRes.ok) {
          const o = await ordersRes.json()
          type OrderRaw = { _id: unknown; customerEmail: string; amountTotal: number; createdAt: string }
          const slim = Array.isArray(o)
            ? o.map((x) => {
              const r = x as Partial<OrderRaw>
              return {
                _id: String(r._id),
                customerEmail: String(r.customerEmail ?? ''),
                amountTotal: Number(r.amountTotal ?? 0),
                createdAt: String(r.createdAt ?? '')
              }
            })
            : []
          if (!cancelled) setOrders(slim)
        } else if (!cancelled) {
          setOrders([])
        }
      } catch {
        if (!cancelled) {
          setStats(null)
          setOrders([])
        }
      }
    }
    fetchStatsAndOrders()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    return () => {
      if (copyTimeoutId) {
        window.clearTimeout(copyTimeoutId);
      }
    };
  }, [copyTimeoutId]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error || 'Event niet gevonden'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/events')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Terug naar overzicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
          <button
            onClick={() => navigate('/admin/events')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Terug naar overzicht
          </button>

          {isObjectId && (
            <button
              onClick={() => navigate(`/admin/event/${event?._id}/edit`)}
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Bewerk Event
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{event.title}</h1>

            <div className="space-y-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">{formatDateTime(event.date)}</span>
              </div>

              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-600">{event.location}</span>
              </div>

              {event.description && (
                <div className="mt-6">
                  <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                </div>
              )}

              {Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold mb-3">Tickettypes</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prijs</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capaciteit</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {event.ticketTypes.map((tt, idx) => (
                          <tr key={`${tt.name}-${idx}`}>
                            <td className="px-4 py-2 text-sm text-gray-900">{tt.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(tt.price ?? 0)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{tt.capacity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            {/* Statistieken voor dit event */}
            {stats && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-3">Statistieken</h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Omzet</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">€ {(stats.revenueCents / 100).toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Tickets verkocht</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.ticketsSold}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Bestellingen</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.ordersCount}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Ingecheckt</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.attendance} / {stats.capacityTotal}</div>
                  </div>
                </div>
              </div>
            )}
            {event.slug && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-3">Publieke link</h2>
                <div className="w-full sm:w-auto grid grid-cols-2 gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/event/${event.slug}`}
                    className="col-span-2 py-2.5 px-3 border border-gray-200 rounded-lg text-sm text-gray-900"
                  />
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/event/${event.slug}`;
                      navigator.clipboard?.writeText(url);
                      setCopied(true);
                      if (copyTimeoutId) window.clearTimeout(copyTimeoutId);
                      const t = window.setTimeout(() => setCopied(false), 2000);
                      setCopyTimeoutId(t);
                    }}
                    disabled={copied}
                    className={`inline-flex items-center rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${copied
                      ? 'bg-green-100 text-green-700 hover:bg-green-100 focus:ring-green-300'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300'
                      }`}
                  >
                    {copied ? 'Gekopieerd!' : 'Kopieer Link'}
                  </button>
                </div>
                {/* Recente orders onder Publieke link */}
                <div className="mt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-gray-900">Recente orders</h3>
                    <div className="w-full sm:w-auto grid grid-cols-2 gap-2">
                      <a
                        href={`/api/orders/export?eventId=${id}`}
                        className="text-sm inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-900 hover:bg-gray-100"
                      >
                        Exporteer CSV
                      </a>
                      <button
                        onClick={() => navigate(`/admin/event/${id}/orders`)}
                        className="text-sm inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                      >
                        Bekijk alle orders
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 overflow-hidden mt-2">
                    {orders.length === 0 ? (
                      <div className="p-4 text-sm text-gray-600">Geen bestellingen</div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {orders.map(o => (
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
