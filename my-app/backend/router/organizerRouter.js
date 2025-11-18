import express from 'express'
import { registerOrganizer, loginOrganizer, logoutOrganizer, me } from '../controller/organizerController.js'

const router = express.Router()

router.post('/register', registerOrganizer)
router.post('/login', loginOrganizer)
router.post('/logout', logoutOrganizer)
router.get('/me', me)

export default router