import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Event {
  _id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  status: 'active' | 'inactive';
}

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('active');
  const navigate = useNavigate();

  const handleStatusChange = (event: Event, status: 'active' | 'inactive') => {
    setSelectedEvent(event);
    setNewStatus(status);
    setShowConfirmation(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/events/${selectedEvent._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Kon status niet updaten');
      }

      const updatedEvent = await response.json();
      setEvents(events.map(event =>
        event._id === selectedEvent._id ? updatedEvent : event
      ));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setShowConfirmation(false);
      setSelectedEvent(null);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Kon events niet ophalen');
        }
        const data = await response.json();
        setEvents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-4 text-gray-600">
        <p>Geen events gevonden</p>
      </div>
    );
  }

  // Filter events based on selected status
  const filteredEvents = filterStatus === 'all'
    ? events
    : events.filter(event => event.status === filterStatus);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
        <h1 className="text-2xl font-bold">Evenementen</h1>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-2">
          <label htmlFor="filter-status" className="text-sm font-medium text-gray-700">
            Filter op status:
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'active' | 'inactive' | 'all')}
            className="w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">Alle events</option>
            <option value="active">Actieve events</option>
            <option value="inactive">Inactieve events</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <div
            key={event._id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg sm:text-xl font-semibold">{event.title}</h2>
                <span className={`px-2 py-1 text-[11px] sm:text-xs font-medium rounded ${event.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                  }`}>
                  {event.status === 'active' ? 'Actief' : 'Inactief'}
                </span>
              </div>
              <p className="text-gray-600 mb-2 text-sm sm:text-base">
                <span className="inline-block mr-2">
                  <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
                {formatDateTime(event.date)}
              </p>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                <span className="inline-block mr-2">
                  <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                {event.location}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-blue-600 hover:text-blue-800 font-medium w-full"
                  onClick={() => navigate(`/admin/event/${event._id}`)}
                >
                  Bekijk details →
                </button>
                <select
                  value={event.status}
                  onChange={(e) => handleStatusChange(event, e.target.value as 'active' | 'inactive')}
                  className="block w-full sm:w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="active">Actief</option>
                  <option value="inactive">Inactief</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedEvent && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Weet je zeker dat je dit event {newStatus === 'active' ? 'actief' : 'inactief'} wilt zetten?
            </h3>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => setShowConfirmation(false)}
              >
                Annuleren
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleConfirmStatusChange}
              >
                Bevestigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;
