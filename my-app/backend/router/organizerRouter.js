import express from 'express'
import { registerOrganizer } from '../controller/organizerController.js'

const router = express.Router()

router.post('/register', registerOrganizer)

export default router