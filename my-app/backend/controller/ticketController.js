import Ticket from '../models/ticketModel.js'
import Event from '../models/eventModel.js'

export const verifyTicket = async (req, res) => {
  try {
    const rawToken = String(req.query.token || '').trim()
    if (!rawToken) return res.status(400).json({ ok: false, message: 'token is vereist' })

    console.log(`[Verify] Verifying token: "${rawToken}"`)

    // Check op demo tokens
    if (rawToken.startsWith('demo')) {
      return res.status(404).json({ ok: false, message: 'Dit is een voorbeeldticket (demo) en kan niet gescand worden.' })
    }

    // Case-insensitive zoeken
    const ticket = await Ticket.findOne({
      token: { $regex: new RegExp(`^${rawToken}$`, 'i') }
    }).lean()

    if (!ticket) {
      console.log(`[Verify] Token "${rawToken}" not found in DB.`)
      return res.status(404).json({ ok: false, message: 'Ticket niet gevonden' })
    }

    const event = await Event.findById(ticket.event).lean()
    console.log(`[Verify] Token "${rawToken}" found. Event: ${event?.title}`)

    return res.json({
      ok: true,
      redeemed: !!ticket.redeemed,
      ticketTypeName: ticket.ticketTypeName,
      attendeeEmail: ticket.attendeeEmail,
      eventId: String(ticket.event || ''),
      event: event ? { title: event.title, location: event.location, date: event.date, slug: event.slug } : null,
    })
  } catch (error) {
    console.error('[Verify] Error:', error)
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
