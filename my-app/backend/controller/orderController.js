import Order from '../models/orderModel.js'
import Event from '../models/eventModel.js'

export const listOrders = async (req, res) => {
  try {
    const userId = req.session?.user?.id
    if (!userId) return res.status(401).json({ message: 'Not authenticated' })

    const { eventId, limit } = req.query || {}
    if (!eventId) return res.status(400).json({ message: 'eventId is required' })

    const event = await Event.findById(String(eventId))
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (String(event.owner) !== String(userId)) return res.status(403).json({ message: 'Forbidden' })

    const lim = Math.min(Number(limit) || 25, 200)
    const orders = await Order.find({ event: eventId }).sort({ createdAt: -1 }).limit(lim).lean()
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message })
  }
}

export const statsByEvent = async (req, res) => {
  try {
    const userId = req.session?.user?.id
    if (!userId) return res.status(401).json({ message: 'Not authenticated' })
    const { id } = req.params
    const event = await Event.findById(String(id))
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (String(event.owner) !== String(userId)) return res.status(403).json({ message: 'Forbidden' })

    const paidOrders = await Order.find({ event: id, status: 'paid' }).lean()
    const revenueCents = paidOrders.reduce((sum, o) => sum + (o.amountTotal || 0), 0)
    const ticketsSold = paidOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0)

    // Capaciteit totaal = som van ticketTypes.capacity
    const capacityTotal = (event.ticketTypes || []).reduce((sum, tt) => sum + Number(tt.capacity || 0), 0)
    const remaining = Math.max(0, capacityTotal - ticketsSold)

    // Aanwezigheid = aantal tickets met redeemed=true
    const { default: Ticket } = await import('../models/ticketModel.js')
    const attendance = await Ticket.countDocuments({ event: id, redeemed: true })
    const percentFilled = capacityTotal > 0 ? Math.round((ticketsSold / capacityTotal) * 100) : 0

    res.json({
      revenueCents,
      currency: 'eur',
      ticketsSold,
      ordersCount: paidOrders.length,
      capacityTotal,
      remaining,
      attendance,
      percentFilled,
    })
  } catch (error) {
    res.status(500).json({ message: 'Error computing stats', error: error.message })
  }
}

export const exportOrdersCsv = async (req, res) => {
  try {
    const userId = req.session?.user?.id
    if (!userId) return res.status(401).json({ message: 'Not authenticated' })
    const { eventId, start, end } = req.query || {}
    if (!eventId) return res.status(400).json({ message: 'eventId is required' })

    const event = await Event.findById(String(eventId))
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (String(event.owner) !== String(userId)) return res.status(403).json({ message: 'Forbidden' })

    const q = { event: eventId }
    if (start || end) {
      q['createdAt'] = {}
      if (start) q['createdAt']['$gte'] = new Date(String(start))
      if (end) q['createdAt']['$lte'] = new Date(String(end))
    }
    const orders = await Order.find(q).sort({ createdAt: -1 }).lean()
    const header = ['createdAt', 'customerEmail', 'status', 'amountTotal', 'currency', 'items'].join(',')
    const lines = orders.map(o => {
      const itemsStr = (o.items || []).map(i => `${i.name} x${i.quantity} @ ${i.unitAmount}`).join(' | ')
      return [o.createdAt?.toISOString(), o.customerEmail, o.status, o.amountTotal, o.currency, `"${itemsStr}"`].join(',')
    })
    const csv = [header, ...lines].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="orders-${eventId}.csv"`)
    res.send(csv)
  } catch (error) {
    res.status(500).json({ message: 'Error exporting orders', error: error.message })
  }
}

export default { listOrders, statsByEvent, exportOrdersCsv }
