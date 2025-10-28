import express from 'express';
import { createEvent, getEvents, getEventById, updateEventStatus } from '../controller/eventController.js';

const router = express.Router();

// Route to create a new event
router.post('/', createEvent);

// Route to fetch all events
router.get('/', getEvents);

// Route to fetch a single event by ID
router.get('/:id', getEventById);

// Route to update event status
router.patch('/:id/status', updateEventStatus);

export default router;
