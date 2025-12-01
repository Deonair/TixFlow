import express from 'express'
import { listOrders, statsByEvent, exportOrdersCsv } from '../controller/orderController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/orders', requireAuth, listOrders)
router.get('/orders/export', requireAuth, exportOrdersCsv)
router.get('/stats/event/:id', requireAuth, statsByEvent)

export default router

