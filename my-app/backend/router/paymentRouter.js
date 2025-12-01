// backend/router/paymentRouter.js
import { Router } from 'express'
import { createCheckoutSession } from '../controller/paymentController.js'

const router = Router()

router.post('/checkout-session', createCheckoutSession)

export default router

