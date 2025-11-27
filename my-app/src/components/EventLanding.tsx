import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface TicketType {
  name: string;
  price: number;
  capacity: number;
}

interface EventPublic {
  slug: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  ticketTypes?: TicketType[];
  owner?: string; // organizer id
  ownerName?: string; // organizer naam voor weergave
}

const EventLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<number[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/slug/${slug}`);
        if (!response.ok) {
          throw new Error('Event niet gevonden');
        }
        const data = await response.json();
        setEvent(data);
        const count = Array.isArray(data?.ticketTypes) ? data.ticketTypes.length : 0;
        setQuantities(new Array(count).fill(0));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchEvent();
  }, [slug]);

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

  const fmtCurrency = (amount: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount ?? 0);

  const total = useMemo(() => {
    if (!event?.ticketTypes) return 0;
    return event.ticketTypes.reduce((sum, tt, i) => sum + (tt.price ?? 0) * (quantities[i] ?? 0), 0);
  }, [event, quantities]);

  const setQty = (index: number, value: number) => {
    if (!event?.ticketTypes) return;
    const cap = Math.max(0, event.ticketTypes[index]?.capacity ?? 0);
    const safe = Math.min(Math.max(0, Math.floor(value || 0)), cap);
    setQuantities(q => q.map((v, i) => (i === index ? safe : v)));
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
                <p className="text-sm text-red-700">{error || 'Event niet gevonden'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linker kolom: details + ticket selectie */}
        <div className="lg:col-span-2">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 006 0z" />
                  </svg>
                  <span className="text-gray-600">{event.location}</span>
                </div>

                {event.description && (
                  <div className="mt-6">
                    <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                  </div>
                )}

                <div className="mt-8">
                  <h2 className="text-lg font-semibold mb-4">Tickets kiezen</h2>
                  {Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0 ? (
                    <div className="space-y-4">
                      {event.ticketTypes.map((tt, idx) => (
                        <div key={`${tt.name}-${idx}`} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                          <div>
                            <div className="font-medium text-gray-900">{tt.name}</div>
                            <div className="text-sm text-gray-600">{fmtCurrency(tt.price)} · Capaciteit: {tt.capacity}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={() => setQty(idx, (quantities[idx] ?? 0) - 1)}
                              aria-label="Verlaag aantal"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={tt.capacity ?? 0}
                              value={quantities[idx] ?? 0}
                              onChange={e => setQty(idx, Number(e.target.value))}
                              className="w-16 h-9 text-center rounded-md border border-gray-300"
                            />
                            <button
                              className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={() => setQty(idx, (quantities[idx] ?? 0) + 1)}
                              aria-label="Verhoog aantal"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600">Geen tickets beschikbaar</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rechter kolom: winkelmand + totaal */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Winkelmand</h2>
            </div>
            <div className="p-6 space-y-4">
              {event?.ticketTypes && event.ticketTypes.some((_, i) => (quantities[i] ?? 0) > 0) ? (
                <div className="space-y-3">
                  {event.ticketTypes.map((tt, i) => {
                    const qty = quantities[i] ?? 0;
                    if (qty <= 0) return null;
                    const line = (tt.price ?? 0) * qty;
                    return (
                      <div key={`cart-${tt.name}-${i}`} className="flex items-center justify-between">
                        <div className="text-gray-800">
                          {tt.name} × {qty}
                        </div>
                        <div className="text-gray-900 font-medium">{fmtCurrency(line)}</div>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                    <div className="text-gray-600">Totaal</div>
                    <div className="text-gray-900 font-semibold">{fmtCurrency(total)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">Nog geen tickets geselecteerd</div>
              )}
            </div>
            <div className="px-6 pb-6">
              <button
                disabled={total <= 0}
                className={`w-full inline-flex items-center justify-center rounded-lg px-4 py-2.5 ${total > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                onClick={() => {
                  if (!event || !slug || total <= 0) return;
                  // Alleen geselecteerde tickets meenemen
                  const selections = (event.ticketTypes ?? [])
                    .map((tt, i) => ({ name: tt.name, price: tt.price, qty: quantities[i] ?? 0 }))
                    .filter(s => s.qty > 0);
                  navigate(`/event/${slug}/checkout`, {
                    state: {
                      event: {
                        slug: event.slug,
                        title: event.title,
                        date: event.date,
                        location: event.location,
                        description: event.description,
                        owner: event.owner,
                        ownerName: event.ownerName,
                        ticketTypes: event.ticketTypes,
                      },
                      selections,
                    }
                  });
                }}
              >
                Koop nu
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EventLanding;
