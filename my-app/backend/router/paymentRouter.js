// backend/router/paymentRouter.js
import express from 'express'
import { createCheckoutSession, confirmCheckoutSession } from '../controller/paymentController.js'

const router = express.Router()

router.post('/checkout-session', createCheckoutSession)
router.get('/confirm/:sessionId', confirmCheckoutSession)

export default router
