import express from 'express';
import { createEvent, getEvents, getEventById, updateEventStatus, updateEvent, getEventBySlug } from '../controller/eventController.js';

const router = express.Router();

// Route to create a new event
router.post('/', createEvent);

// Route to fetch all events
router.get('/', getEvents);

// Public route to fetch a single event by slug (must be before :id)
router.get('/slug/:slug', getEventBySlug);

// Route to fetch a single event by ID
router.get('/:id', getEventById);

// Route to update event status
router.patch('/:id/status', updateEventStatus);

// Route to update event fields
router.put('/:id', updateEvent);

export default router;
