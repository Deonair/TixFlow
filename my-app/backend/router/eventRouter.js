import express from 'express';
import { createEvent, getEvents, getEventById, updateEventStatus, updateEvent, getEventBySlug } from '../controller/eventController.js';
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router();

// Route to create a new event (protected)
router.post('/', requireAuth, createEvent);

// Route to fetch all events (protected; only own events)
router.get('/', requireAuth, getEvents);

// Public route to fetch a single event by slug (must be before :id)
router.get('/slug/:slug', getEventBySlug);

// Route to fetch a single event by ID (protected; ownership checked in controller)
router.get('/:id', requireAuth, getEventById);

// Route to update event status (protected; ownership checked in controller)
router.patch('/:id/status', requireAuth, updateEventStatus);

// Route to update event fields (protected; ownership checked in controller)
router.put('/:id', requireAuth, updateEvent);

export default router;
