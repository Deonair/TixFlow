import Event from '../models/eventModel.js';

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const { title, date, location, description, ticketTypes } = req.body || {};

    // Basale validatie
    if (!title || !date || !location) {
      return res.status(400).json({
        message: 'Validation error',
        errors: {
          title: !title ? 'title is required' : undefined,
          date: !date ? 'date is required' : undefined,
          location: !location ? 'location is required' : undefined,
        }
      });
    }

    // Normaliseer datum (string → Date)
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Validatie ticketTypes (optioneel, maar als aanwezig dan strikt)
    const normalizedTicketTypes = Array.isArray(ticketTypes) ? ticketTypes : [];
    const ttErrors = [];
    normalizedTicketTypes.forEach((tt, idx) => {
      const errs = {};
      if (!tt || typeof tt !== 'object') {
        ttErrors[idx] = { name: 'invalid ticket type payload' };
        return;
      }
      const name = (tt.name ?? '').trim();
      const price = Number(tt.price);
      const capacity = Number(tt.capacity);

      if (!name) errs['name'] = 'name is required';
      if (!Number.isFinite(price) || price < 0) errs['price'] = 'price must be >= 0';
      if (!Number.isInteger(capacity) || capacity < 0) errs['capacity'] = 'capacity must be an integer >= 0';

      if (Object.keys(errs).length > 0) ttErrors[idx] = errs;
    });

    if (ttErrors.some(Boolean)) {
      return res.status(400).json({ message: 'TicketTypes validation error', errors: ttErrors });
    }

    const newEvent = new Event({
      title,
      date: parsedDate,
      location,
      description,
      ticketTypes: normalizedTicketTypes.map(tt => ({
        name: String(tt.name).trim(),
        price: Number(tt.price),
        capacity: Number(tt.capacity),
      })),
    });
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', { body: req.body, error });
    res.status(500).json({
      message: 'Error creating event',
      error: error.message
    });
  }
};

// Fetch all events
export const getEvents = async (_req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

// Fetch single event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Missing event id' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event by id:', { params: req.params, error });
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
};

// Update event status
export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'Missing event id' });
    }
    const allowed = ['active', 'inactive'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status', allowed });
    }

    const updated = await Event.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating event status:', { params: req.params, body: req.body, error });
    res.status(500).json({ message: 'Error updating event status', error: error.message });
  }
};

// Update event fields (title, date, location, description)
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, location, description, ticketTypes } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'Missing event id' });
    }

    // Validate required fields (zoals eerder)
    if (!title || !date || !location) {
      return res.status(400).json({
        message: 'Validation error',
        errors: {
          title: !title ? 'title is required' : undefined,
          date: !date ? 'date is required' : undefined,
          location: !location ? 'location is required' : undefined,
        }
      });
    }

    // Normalize date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // TicketTypes zijn optioneel, maar als aanwezig dan valideren
    let normalizedTicketTypes;
    if (typeof ticketTypes !== 'undefined') {
      if (!Array.isArray(ticketTypes)) {
        return res.status(400).json({ message: 'ticketTypes must be an array' });
      }
      const ttErrors = [];
      ticketTypes.forEach((tt, idx) => {
        const errs = {};
        const name = (tt?.name ?? '').trim();
        const price = Number(tt?.price);
        const capacity = Number(tt?.capacity);

        if (!name) errs['name'] = 'name is required';
        if (!Number.isFinite(price) || price < 0) errs['price'] = 'price must be >= 0';
        if (!Number.isInteger(capacity) || capacity < 0) errs['capacity'] = 'capacity must be an integer >= 0';

        if (Object.keys(errs).length > 0) ttErrors[idx] = errs;
      });

      if (ttErrors.some(Boolean)) {
        return res.status(400).json({ message: 'TicketTypes validation error', errors: ttErrors });
      }

      normalizedTicketTypes = ticketTypes.map(tt => ({
        name: String(tt.name).trim(),
        price: Number(tt.price),
        capacity: Number(tt.capacity),
      }));
    }

    const updateFields = {
      title,
      date: parsedDate,
      location,
      description,
      ...(typeof normalizedTicketTypes !== 'undefined' ? { ticketTypes: normalizedTicketTypes } : {})
    };

    const updated = await Event.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating event:', { params: req.params, body: req.body, error });
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};


