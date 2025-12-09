import express from 'express'
import { registerOrganizer, loginOrganizer, logoutOrganizer, me, updateMe } from '../controller/organizerController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register', registerOrganizer)
router.post('/login', loginOrganizer)
router.post('/logout', logoutOrganizer)
router.get('/me', me)
router.patch('/me', requireAuth, updateMe)

export default router
