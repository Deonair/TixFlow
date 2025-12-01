import { Router } from 'express'
import { verifyTicket, redeemTicket } from '../controller/ticketController.js'

const router = Router()

router.get('/tickets/verify', verifyTicket)
router.post('/tickets/redeem', redeemTicket)

export default router

