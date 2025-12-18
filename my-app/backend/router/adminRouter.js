import express from 'express'
import Organizer from '../models/organizerModel.js'
import Event from '../models/eventModel.js'
import Order from '../models/orderModel.js'
import Ticket from '../models/ticketModel.js'
import { requireSuperAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Superadmin login met env credentials; zet sessieveld superadmin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const envEmail = String(process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim()
    const envPass = String(process.env.SUPERADMIN_PASSWORD || '').trim()
    const ok = email && password && String(email).toLowerCase().trim() === envEmail && String(password).trim() === envPass
    if (!ok) return res.status(401).json({ message: 'Invalid superadmin credentials' })
    req.session.superadmin = { email: envEmail }
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ message: 'Superadmin login error', error: error.message })
  }
})

router.get('/me', requireSuperAdmin, (req, res) => {
  res.json({ ok: true, role: 'superadmin', email: req.session?.superadmin?.email || null })
})

router.post('/logout', requireSuperAdmin, async (req, res) => {
  try {
    req.session.superadmin = null
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ message: 'Superadmin logout error', error: error.message })
  }
})

// Lijst organisatoren, optioneel inclusief stats
router.get('/organizers', requireSuperAdmin, async (req, res) => {
  try {
    const includeStats = String(req.query.includeStats || 'true') === 'true'
    const organizers = await Organizer.find({}).lean()
    if (!includeStats) {
      return res.json(organizers.map(o => ({ id: String(o._id), name: o.name, email: o.email, organization: o.organization, iban: o.iban || '', kvk: o.kvk || '', btw: o.btw || '', billingContact: o.billingContact || '' })))
    }

    const results = []
    for (const org of organizers) {
      const eventIds = (await Event.find({ owner: org._id }, { _id: 1 }).lean()).map(e => e._id)
      let revenueCents = 0
      let ticketsSold = 0
      if (eventIds.length > 0) {
        const orders = await Order.find({ event: { $in: eventIds }, status: 'paid' }, { amountTotal: 1, items: 1 }).lean()
        revenueCents = orders.reduce((sum, o) => sum + (o.amountTotal || 0), 0)
        ticketsSold = orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0)
      }
      const feePerTicketCents = 50
      const platformFeeCents = ticketsSold * feePerTicketCents
      const organizerEarningsCents = Math.max(0, revenueCents - platformFeeCents)
      const eventsCount = eventIds.length
      const redeemedCount = eventIds.length > 0 ? await Ticket.countDocuments({ event: { $in: eventIds }, redeemed: true }) : 0
      results.push({
        id: String(org._id),
        name: org.name,
        email: org.email,
        organization: org.organization,
        iban: org.iban || '',
        kvk: org.kvk || '',
        btw: org.btw || '',
        billingContact: org.billingContact || '',
        eventsCount,
        ticketsSold,
        revenueCents,
        platformFeeCents,
        organizerEarningsCents,
        redeemedCount,
      })
    }
    res.json(results)
  } catch (error) {
    res.status(500).json({ message: 'Error listing organizers', error: error.message })
  }
})

// Detail van één organizer
router.get('/organizers/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const org = await Organizer.findById(String(id)).lean()
    if (!org) return res.status(404).json({ message: 'Organizer not found' })
    res.json({ id: String(org._id), name: org.name, email: org.email, organization: org.organization, iban: org.iban || '', kvk: org.kvk || '', btw: org.btw || '', billingContact: org.billingContact || '' })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizer', error: error.message })
  }
})

// DEBUG: Lijst laatste tickets om productie problemen te vinden
router.get('/debug/tickets', requireSuperAdmin, async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('event', 'title slug')
      .populate('order', 'customerEmail stripeSessionId')
      .lean();

    res.json(tickets.map(t => ({
      _id: t._id,
      token: t.token,
      event: t.event?.title || 'Unknown',
      email: t.attendeeEmail,
      redeemed: t.redeemed,
      createdAt: t.createdAt,
      orderId: t.order?._id,
      sessionId: t.order?.stripeSessionId
    })));
  } catch (error) {
    res.status(500).json({ message: 'Debug error', error: error.message });
  }
})

// DEBUG: Lees betalingslogs
router.get('/debug/logs', requireSuperAdmin, async (req, res) => {
  try {
    const fs = await import('fs')
    const path = await import('path')
    const logPath = path.resolve(process.cwd(), 'debug-payments.log')

    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf-8')
      // Geef laatste 100 regels
      const lines = content.split('\n').filter(Boolean).slice(-100).reverse()
      res.json(lines)
    } else {
      res.json(['Geen logs gevonden (nog geen transacties geweest na update).'])
    }
  } catch (error) {
    res.status(500).json({ message: 'Log error', error: error.message })
  }
})


// Update velden (mag locks doorbreken, met validatie)
router.patch('/organizers/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, organization, iban, kvk, btw, billingContact } = req.body || {}
    const updates = {}
    const errs = {}
    const nameStr = typeof name === 'string' ? name.trim() : undefined
    const emailStr = typeof email === 'string' ? email.toLowerCase().trim() : undefined
    const orgStr = typeof organization === 'string' ? organization.trim() : undefined
    let ibanStr = typeof iban === 'string' ? iban.replace(/\s+/g, '').toUpperCase().trim() : undefined
    const kvkStr = typeof kvk === 'string' ? kvk.trim() : undefined
    const btwStr = typeof btw === 'string' ? btw.trim().toUpperCase() : undefined
    const contactStr = typeof billingContact === 'string' ? billingContact.trim() : undefined

    if (nameStr !== undefined) { if (!nameStr) errs.name = 'name is required'; else updates.name = nameStr }
    if (emailStr !== undefined) { if (!/^\S+@\S+\.\S+$/.test(emailStr)) errs.email = 'invalid email'; else updates.email = emailStr }
    if (orgStr !== undefined) { if (!orgStr) errs.organization = 'organization is required'; else if (orgStr.length > 150) errs.organization = 'organization too long'; else updates.organization = orgStr }
    if (ibanStr !== undefined) { if (!ibanStr) errs.iban = 'iban is required'; else if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(ibanStr)) errs.iban = 'invalid iban'; else updates.iban = ibanStr }
    if (kvkStr !== undefined) { if (!/^\d{8}$/.test(kvkStr)) errs.kvk = 'invalid kvk'; else updates.kvk = kvkStr }
    if (btwStr !== undefined) { if (!/^NL\d{9}B\d{2}$/.test(btwStr)) errs.btw = 'invalid btw'; else updates.btw = btwStr }
    if (contactStr !== undefined) { if (!contactStr) errs.billingContact = 'billingContact is required'; else if (contactStr.length > 100) errs.billingContact = 'billingContact too long'; else updates.billingContact = contactStr }
    if (Object.keys(errs).length) return res.status(400).json({ message: 'Validation error', errors: errs })

    if (updates.email) {
      const exists = await Organizer.findOne({ email: updates.email, _id: { $ne: id } })
      if (exists) return res.status(409).json({ message: 'Email already in use' })
    }
    const updated = await Organizer.findByIdAndUpdate(String(id), updates, { new: true })
    if (!updated) return res.status(404).json({ message: 'Organizer not found' })
    res.json({ id: String(updated._id), name: updated.name, email: updated.email, organization: updated.organization, iban: updated.iban || '', kvk: updated.kvk || '', btw: updated.btw || '', billingContact: updated.billingContact || '' })
  } catch (error) {
    res.status(500).json({ message: 'Error updating organizer', error: error.message })
  }
})

// Globale statistieken voor dashboard
router.get('/stats', requireSuperAdmin, async (req, res) => {
  try {
    const [organizersCount, eventsCount, liveEventsCount] = await Promise.all([
      Organizer.countDocuments({}),
      Event.countDocuments({}),
      Event.countDocuments({ status: 'active' }),
    ])
    const now = new Date()
    const upcomingEventsCount = await Event.countDocuments({ status: 'active', date: { $gte: now } })

    // Sommeer orders (paid)
    const orders = await Order.find({ status: 'paid' }, { amountTotal: 1, items: 1 }).lean()
    const totalRevenueCents = orders.reduce((sum, o) => sum + (o.amountTotal || 0), 0)
    const totalTicketsSold = orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0)
    const feePerTicketCents = 50
    const platformFeeCents = totalTicketsSold * feePerTicketCents
    const organizerEarningsCents = Math.max(0, totalRevenueCents - platformFeeCents)

    res.json({
      organizersCount,
      eventsCount,
      liveEventsCount,
      upcomingEventsCount,
      totalRevenueCents,
      totalTicketsSold,
      platformFeeCents,
      organizerEarningsCents,
    })
  } catch (error) {
    res.status(500).json({ message: 'Error computing stats', error: error.message })
  }
})

// Evenementenoverzicht (schema) met per-event basisstatistieken
router.get('/events', requireSuperAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || '').trim()
    const upcoming = String(req.query.upcoming || '').trim() === 'true'
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100))

    const filter = {}
    if (status) filter.status = status
    if (upcoming) filter.date = { $gte: new Date() }

    const events = await Event.find(filter).sort({ date: 1 }).limit(limit).lean()
    const eventIds = events.map(e => e._id)

    // Orders per event (paid)
    const ordersByEvent = {}
    if (eventIds.length > 0) {
      const orders = await Order.find({ status: 'paid', event: { $in: eventIds } }, { event: 1, amountTotal: 1, items: 1 }).lean()
      for (const o of orders) {
        const key = String(o.event)
        const bucket = ordersByEvent[key] || { revenueCents: 0, ticketsSold: 0 }
        bucket.revenueCents += (o.amountTotal || 0)
        bucket.ticketsSold += (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0)
        ordersByEvent[key] = bucket
      }
    }

    // Redeemed tickets per event
    const redeemedByEvent = {}
    if (eventIds.length > 0) {
      const agg = await Ticket.aggregate([
        { $match: { event: { $in: eventIds }, redeemed: true } },
        { $group: { _id: '$event', count: { $sum: 1 } } }
      ])
      for (const r of agg) redeemedByEvent[String(r._id)] = r.count || 0
    }

    // Capacity per event
    function totalCapacity(e) {
      const types = Array.isArray(e.ticketTypes) ? e.ticketTypes : []
      return types.reduce((sum, t) => sum + (t.capacity || 0), 0)
    }

    // Owner info lookup
    const ownerIds = [...new Set(events.map(e => String(e.owner)))]
    const owners = ownerIds.length > 0 ? await Organizer.find({ _id: { $in: ownerIds } }, { name: 1, organization: 1 }).lean() : []
    const ownerMap = new Map(owners.map(o => [String(o._id), { name: o.name, organization: o.organization }]))

    const payload = events.map(e => {
      const key = String(e._id)
      const stats = ordersByEvent[key] || { revenueCents: 0, ticketsSold: 0 }
      const redeemed = redeemedByEvent[key] || 0
      const cap = totalCapacity(e)
      const owner = ownerMap.get(String(e.owner)) || { name: '', organization: '' }
      return {
        id: String(e._id),
        title: e.title,
        date: e.date,
        status: e.status,
        ownerName: owner.name,
        ownerOrganization: owner.organization,
        capacity: cap,
        ticketsSold: stats.ticketsSold,
        redeemedCount: redeemed,
        revenueCents: stats.revenueCents,
      }
    })

    res.json(payload)
  } catch (error) {
    res.status(500).json({ message: 'Error listing events for admin', error: error.message })
  }
})

export default router

