import express from 'express';
import { createEvent } from '../controller/eventcontroller.js';


const router = express.Router();

// Route to create a new event
router.post('/', createEvent);

export default router;
