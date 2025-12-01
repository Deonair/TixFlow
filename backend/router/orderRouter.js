import express from 'express'
import { listOrders, statsByEvent, exportOrdersCsv } from '../controller/orderController.js'

const router = express.Router()

router.get('/orders', listOrders)
router.get('/orders/export', exportOrdersCsv)
router.get('/stats/event/:id', statsByEvent)

export default router

