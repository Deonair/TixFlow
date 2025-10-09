import { useState } from 'react';

interface EventFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

const EventForm = () => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    date: '',
    time: '',
    location: '',
    description: ''
  });

  const [errors, setErrors] = useState<Partial<EventFormData>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when field is edited
    if (errors[name as keyof EventFormData]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Partial<EventFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel is verplicht';
    }

    if (!formData.date) {
      newErrors.date = 'Datum is verplicht';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Locatie is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // combineer date + time naar ISO string
    const dateIso = formData.time
      ? new Date(`${formData.date}T${formData.time}:00`).toISOString()
      : new Date(formData.date).toISOString();

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          date: dateIso,
          location: formData.location,
          description: formData.description,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Request failed: ${res.status}`);
      }

      // succes
      setIsSubmitted(true);
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        title: (err.message || 'Er ging iets mis'),
      }));
    }
  };


  if (isSubmitted) {
    return (
      <section className="card card-bordered w-full max-w-xl">
        <div className="card-body">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <h2 className="mt-3 text-lg font-medium text-gray-900">Event succesvol aangemaakt!</h2>
            <p className="mt-2 text-sm text-gray-500">
              Je event "{formData.title}" is succesvol aangemaakt.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setFormData({
                    title: '',
                    date: '',
                    time: '',
                    location: '',
                    description: ''
                  });
                  setIsSubmitted(false);
                }}
                className="btn btn-primary"
              >
                Nieuw event aanmaken
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card card-bordered max-w-xl mx-auto">
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="w-full">
            <label className="sr-only" htmlFor="title">Titel *</label>
            <input
              className={`input input-solid max-w-full ${errors.title ? 'input-error' : ''}`}
              placeholder="Titel *"
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="sr-only" htmlFor="date">Datum *</label>
              <input
                className={`input input-solid ${errors.date ? 'input-error' : ''}`}
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
              {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
            </div>

            <div>
              <label className="sr-only" htmlFor="time">Tijd</label>
              <input
                className="input input-solid"
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="w-full">
            <label className="sr-only" htmlFor="location">Locatie *</label>
            <input
              className={`input input-solid max-w-full ${errors.location ? 'input-error' : ''}`}
              placeholder="Locatie *"
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
            {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
          </div>

          <div className="w-full">
            <label className="sr-only" htmlFor="description">Beschrijving</label>
            <textarea
              className="textarea textarea-solid max-w-full"
              placeholder="Beschrijving"
              rows={8}
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="mt-4">
            <button type="submit" className="rounded-lg btn btn-primary btn-block">Event Aanmaken</button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EventForm;