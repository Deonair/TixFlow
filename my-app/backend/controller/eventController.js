import Event from '../models/eventModel.js';

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const { title, date, location, description } = req.body || {};

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

    const newEvent = new Event({
      title,
      date: parsedDate,
      location,
      description,
    });
    const savedEvent = await newEvent.save(); // slaat het op in MongoDB
    res.status(201).json(savedEvent);        // stuurt het opgeslagen event terug
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


