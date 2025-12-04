import Ticket from '../models/ticketModel.js'
import Event from '../models/eventModel.js'

export const verifyTicket = async (req, res) => {
  try {
    const token = String(req.query.token || '').trim()
    if (!token) return res.status(400).json({ ok: false, message: 'token is vereist' })
    const ticket = await Ticket.findOne({ token }).lean()
    if (!ticket) return res.status(404).json({ ok: false, message: 'Ticket niet gevonden' })
    const event = await Event.findById(ticket.event).lean()
    return res.json({
      ok: true,
      redeemed: !!ticket.redeemed,
      ticketTypeName: ticket.ticketTypeName,
      attendeeEmail: ticket.attendeeEmail,
      eventId: String(ticket.event || ''),
      event: event ? { title: event.title, location: event.location, date: event.date, slug: event.slug } : null,
    })
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Interne fout', error: error.message })
  }
}

export const redeemTicket = async (req, res) => {
  try {
    const token = String(req.body.token || '').trim()
    if (!token) return res.status(400).json({ ok: false, message: 'token is vereist' })
    const ticket = await Ticket.findOne({ token })
    if (!ticket) return res.status(404).json({ ok: false, message: 'Ticket niet gevonden' })
    if (ticket.redeemed) return res.status(409).json({ ok: false, message: 'Ticket al gebruikt' })
    ticket.redeemed = true
    await ticket.save()
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Interne fout', error: error.message })
  }
}

export default { verifyTicket, redeemTicket }
