import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface EventFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}
type TicketTypeInput = { name: string; price: string; capacity: string };
type TicketTypeError = Partial<TicketTypeInput>;

const CHAR_LIMITS = {
  title: 25,
  location: 50,
  description: 400
};

const EventEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    date: '',
    time: '',
    location: '',
    description: ''
  });

  const [errors, setErrors] = useState<Partial<EventFormData>>({});
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([{ name: '', price: '', capacity: '' }]);
  const [ticketErrors, setTicketErrors] = useState<TicketTypeError[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) throw new Error('Event niet gevonden');
        const data = await res.json();

        const dt = new Date(data.date);
        const dateStr = dt.toISOString().slice(0, 10);
        const timeStr = dt.toISOString().slice(11, 16);

        setFormData({
          title: data.title || '',
          date: dateStr,
          time: timeStr,
          location: data.location || '',
          description: data.description || ''
        });

        const existingTT = Array.isArray(data.ticketTypes) ? data.ticketTypes : [];
        setTicketTypes(
          existingTT.length
            ? existingTT.map((tt: any) => ({
              name: tt.name ?? '',
              price: String(tt.price ?? ''),
              capacity: String(tt.capacity ?? '')
            }))
            : [{ name: '', price: '', capacity: '' }]
        );

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEvent();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (CHAR_LIMITS[name as keyof typeof CHAR_LIMITS] &&
      value.length > CHAR_LIMITS[name as keyof typeof CHAR_LIMITS]) {
      return;
    }

    setFormData({ ...formData, [name]: value });

    if (errors[name as keyof EventFormData]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Partial<EventFormData> = {};
    if (!formData.title.trim()) newErrors.title = 'Titel is verplicht';
    if (!formData.date) newErrors.date = 'Datum is verplicht';
    if (!formData.location.trim()) newErrors.location = 'Locatie is verplicht';

    const ttErrs: TicketTypeError[] = [];
    ticketTypes.forEach((tt, idx) => {
      const errs: TicketTypeError = {};
      const anyFilled = tt.name.trim() || tt.price.trim() || tt.capacity.trim();
      if (anyFilled) {
        if (!tt.name.trim()) errs.name = 'Naam is verplicht';
        const price = Number(tt.price);
        if (!tt.price.trim() || !Number.isFinite(price) || price < 0) errs.price = 'Prijs ≥ 0';
        const cap = Number(tt.capacity);
        if (!tt.capacity.trim() || !Number.isInteger(cap) || cap < 0) errs.capacity = 'Capaciteit ≥ 0 (geheel)';
      }
      ttErrs[idx] = errs;
    });

    setTicketErrors(ttErrs);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && ttErrs.every(e => !e || Object.keys(e).length === 0);
  };

  const handleTicketChange = (idx: number, field: keyof TicketTypeInput, value: string) => {
    const next = [...ticketTypes];
    next[idx] = { ...next[idx], [field]: value };
    setTicketTypes(next);
  };
  const addTicketType = () => setTicketTypes(prev => [...prev, { name: '', price: '', capacity: '' }]);
  const removeTicketType = (idx: number) => setTicketTypes(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !id) return;
    setSubmitLoading(true);

    const dateIso = formData.time
      ? new Date(`${formData.date}T${formData.time}:00`).toISOString()
      : new Date(formData.date).toISOString();

    const payloadTicketTypes = ticketTypes
      .filter(tt => tt.name.trim())
      .map(tt => ({ name: tt.name.trim(), price: Number(tt.price), capacity: Number(tt.capacity) }));

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          date: dateIso,
          location: formData.location,
          description: formData.description,
          ticketTypes: payloadTicketTypes,
        })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Request failed: ${res.status}`);
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, title: (err.message || 'Er ging iets mis') }));
    } finally {
      setSubmitLoading(false);
    }
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => navigate('/admin/events')}
            className="inline-flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Terug naar overzicht
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <section className="mx-auto max-w-xl">
        <div className="rounded-lg bg-white shadow-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <h2 className="mt-3 text-lg font-medium text-gray-900">Event succesvol bijgewerkt!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Je wijzigingen voor "{formData.title}" zijn opgeslagen.
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => navigate(`/admin/event/${id}`)}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Terug naar details
              </button>
              <button
                onClick={() => setIsSubmitted(false)}
                className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2.5 text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                Verder bewerken
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl">
      <div className="rounded-lg bg-white shadow-lg p-6">
        <h1 className="text-xl font-semibold mb-4">Event bewerken</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="w-full">
            <label className="block text-sm font-medium mb-2" htmlFor="title">Titel *</label>
            <input
              className={`py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none ${errors.title ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''}`}
              placeholder="Titel *"
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={CHAR_LIMITS.title}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="date">Datum *</label>
              <input
                className={`py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none ${errors.date ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''}`}
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="time">Tijd</label>
              <input
                className="py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none"
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-2" htmlFor="location">Locatie *</label>
            <input
              className={`py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none ${errors.location ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : ''}`}
              placeholder="Locatie *"
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              maxLength={CHAR_LIMITS.location}
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-2" htmlFor="description">Beschrijving</label>
            <textarea
              className="py-2.5 px-3 block w-full border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none"
              placeholder="Beschrijving"
              rows={8}
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={CHAR_LIMITS.description}
            ></textarea>
          </div>

          {/* Tickettypes sectie */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Tickettypes</h2>

            {ticketTypes.map((tt, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2">Naam</label>
                  <input
                    type="text"
                    className={`py-2.5 px-3 block w-full border rounded-lg text-sm ${ticketErrors[idx]?.name ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-gray-200 focus:border-blue-600 focus:ring-blue-600'}`}
                    placeholder="Bijv. Standaard"
                    value={tt.name}
                    onChange={(e) => handleTicketChange(idx, 'name', e.target.value)}
                    maxLength={50}
                  />
                  {ticketErrors[idx]?.name && (
                    <p className="mt-1 text-sm text-red-600">{ticketErrors[idx]?.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Prijs (€)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className={`py-2.5 px-3 block w-full border rounded-lg text-sm ${ticketErrors[idx]?.price ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-gray-200 focus:border-blue-600 focus:ring-blue-600'}`}
                    placeholder="0.00"
                    value={tt.price}
                    onChange={(e) => handleTicketChange(idx, 'price', e.target.value)}
                  />
                  {ticketErrors[idx]?.price && (
                    <p className="mt-1 text-sm text-red-600">{ticketErrors[idx]?.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Capaciteit</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={`py-2.5 px-3 block w-full border rounded-lg text-sm ${ticketErrors[idx]?.capacity ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-gray-200 focus:border-blue-600 focus:ring-blue-600'}`}
                    placeholder="0"
                    value={tt.capacity}
                    onChange={(e) => handleTicketChange(idx, 'capacity', e.target.value)}
                  />
                  {ticketErrors[idx]?.capacity && (
                    <p className="mt-1 text-sm text-red-600">{ticketErrors[idx]?.capacity}</p>
                  )}
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeTicketType(idx)}
                    className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  >
                    Verwijder
                  </button>
                </div>
              </div>
            ))}

            <div>
              <button
                type="button"
                onClick={addTicketType}
                className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2.5 text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                Tickettype toevoegen
              </button>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={submitLoading}
              className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitLoading ? 'Bezig met opslaan…' : 'Wijzigingen Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EventEdit;