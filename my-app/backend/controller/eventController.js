import Event from '../models/eventModel.js';

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const newEvent = new Event(req.body);   // maakt nieuw event aan met data uit de body
    const savedEvent = await newEvent.save(); // slaat het op in MongoDB
    res.status(201).json(savedEvent);        // stuurt het opgeslagen event terug
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      message: 'Error creating event',
      error: error.message
    });
  }
};


