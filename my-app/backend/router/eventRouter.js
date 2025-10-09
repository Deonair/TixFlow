import express from 'express';
import { createEvent, getEvents } from '../controller/eventController.js';


const router = express.Router();

// Route to create a new event
router.post('/', createEvent);

// Route to fetch all events
router.get('/', getEvents);

export default router;
