// backend/controller/paymentController.js
import Stripe from 'stripe'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { sendTicketsEmail } from '../services/emailService.js'

// Zorg dat env beschikbaar is, ongeacht importvolgorde
dotenv.config()

// Lazy initialisatie zodat we zeker weten dat env geladen is
let stripe = null
const getStripe = () => {
  if (stripe) return stripe
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) return null
  stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
  return stripe
}

export const createCheckoutSession = async (req, res) => {
  try {
    const s = getStripe()
    if (!s) return res.status(500).json({ error: 'Stripe is not configured' })

    const { slug, selections, customer } = req.body || {}
    if (!Array.isArray(selections) || selections.length === 0 || !slug) {
      return res.status(400).json({ error: 'Ongeldige payload' })
    }

    // Normaliseer APP_BASE_URL zodat we altijd een geldige scheme hebben
    const normalizeBaseUrl = (value) => {
      let v = String(value || '').trim()
      if (!v) return 'http://localhost:5173'
      // Corrigeer veelvoorkomende typefout: 'ttp://' → 'http://'
      v = v.replace(/^ttp:\/\//i, 'http://')
      // Voeg https:// toe als er geen scheme is
      if (!/^https?:\/\//i.test(v)) {
        v = `https://${v}`
      }
      // Verwijder trailing slashes
      v = v.replace(/\/+$/, '')
      return v
    }
    const appBase = normalizeBaseUrl(process.env.APP_BASE_URL || 'http://localhost:5173')
    // Haal event en valideer capaciteit per ticket type
    const { default: Event } = await import('../models/eventModel.js')
    const { default: Ticket } = await import('../models/ticketModel.js')
    const eventDoc = await Event.findOne({ slug: String(slug), status: 'active' }).lean()
    if (!eventDoc) return res.status(404).json({ error: 'Event niet gevonden of inactief' })

    const byName = new Map((eventDoc.ticketTypes || []).map(tt => [String(tt.name), tt]))
    const line_items = []
    for (const sel of selections) {
      const name = String(sel.name || '').trim()
      const qty = Math.max(1, Number(sel.qty || 0))
      const tt = byName.get(name)
      if (!tt) return res.status(400).json({ error: `Ticket type onbekend: ${name}` })
      // Bepaal remaining = capacity - aantal reeds aangemaakte tickets
      const sold = await Ticket.countDocuments({ event: eventDoc._id, ticketTypeName: name })
      const remaining = Math.max(0, Number(tt.capacity || 0) - sold)
      if (qty > remaining) {
        return res.status(409).json({ error: `Niet genoeg capaciteit voor ${name}`, remaining })
      }
      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: { name: `${name} – ${slug}` },
          // Prijs afdwingen vanuit server-side event config
          unit_amount: Math.round(Number(tt.price || 0) * 100),
        },
        quantity: qty,
      })
    }

    const session = await s.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: customer?.email,
      client_reference_id: String(slug),
      metadata: { eventSlug: String(slug) },
      success_url: `${appBase}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBase}/checkout/cancel`,
    })

    // Vanaf nieuwe Stripe.js versies is redirectToCheckout verwijderd.
    // Gebruik de door Stripe gegenereerde sessie-URL om te navigeren.
    return res.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({ error: 'Kon geen checkout sessie maken' })
  }
}

export const handleStripeWebhook = async (req, res) => {
  try {
    const s = getStripe()
    if (!s) return res.status(500).json({ error: 'Stripe is not configured' })
    const sig = req.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) return res.status(400).json({ error: 'Webhook secret ontbreekt' })

    let event
    try {
      event = s.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const expanded = await s.checkout.sessions.retrieve(session.id, { expand: ['line_items'] })
        await processPaidSession(expanded, 'webhook')
        break
      }
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    res.status(500).json({ error: 'Interne fout bij webhook' })
  }
}

export default { createCheckoutSession, handleStripeWebhook }

// --- Herbruikbare verwerkingslogica en fallback endpoint ---

import fs from 'fs'
import path from 'path'

// Helper voor file logging (zodat gebruiker het kan zien zonder server toegang)
const logToDebugFile = (msg) => {
  try {
    const logPath = path.resolve(process.cwd(), 'debug-payments.log')
    const timestamp = new Date().toISOString()
    const line = `[${timestamp}] ${msg}\n`
    fs.appendFileSync(logPath, line)
  } catch (e) {
    console.error('Kon niet naar debug file schrijven:', e)
  }
}

async function processPaidSession(expanded, source = 'unknown') {
  try {
    const msgStart = `[Payment] Start processing session ${expanded.id} via ${source}`
    console.log(msgStart)
    logToDebugFile(msgStart)

    // Check vooraf of order al bestaat (snelle check)
    const { default: Order } = await import('../models/orderModel.js')
    const { default: Event } = await import('../models/eventModel.js')
    const { default: Ticket } = await import('../models/ticketModel.js')

    const existingOrder = await Order.findOne({ stripeSessionId: expanded.id }).lean()
    if (existingOrder) {
      const msgExists = `[Payment] Order ${expanded.id} already exists (pre-check). OrderID: ${existingOrder._id}`
      console.log(msgExists)
      logToDebugFile(msgExists)
      return { status: 'already_processed', orderId: existingOrder._id }
    }

    const lineItems = expanded?.line_items?.data || []
    const clientRef = expanded.client_reference_id || expanded.metadata?.eventSlug

    // Zorg dat indexen bestaan (belangrijk voor unieke stripeSessionId)
    // await Order.init().catch(err => console.error('Order index init failed:', err)) 
    // ^ Verplaatst naar index.js startup

    const eventDoc = clientRef ? await Event.findOne({ slug: String(clientRef) }) : null
    if (!eventDoc) {
      console.warn('Session verwerkt: event niet gevonden voor slug', clientRef)
      return { status: 'no_event' }
    }

    const items = lineItems.map(li => {
      const fullName = li.description
      const typeName = typeof fullName === 'string' ? fullName.split(' – ')[0]?.trim() : 'Ticket'
      return {
        name: fullName,
        typeName, // puur tickettype voor capaciteit en opslag
        unitAmount: li.price?.unit_amount ?? 0,
        quantity: li.quantity ?? 0,
      }
    })

    // Atomic upsert om race conditions (dubbele e-mails) te voorkomen.
    const orderData = {
      event: eventDoc._id,
      items,
      amountTotal: expanded.amount_total ?? 0,
      currency: expanded.currency || 'eur',
      customerEmail: expanded.customer_details?.email || expanded.customer_email || 'unknown@example.com',
      stripeSessionId: expanded.id,
      paymentIntentId: expanded.payment_intent ? String(expanded.payment_intent) : undefined,
      status: 'paid',
    }

    const result = await Order.findOneAndUpdate(
      { stripeSessionId: expanded.id },
      { $setOnInsert: orderData },
      { upsert: true, new: true, includeResultMetadata: true }
    )

    const orderDoc = result.value
    // Als updatedExisting true is, bestond de order al -> stop.
    if (result.lastErrorObject?.updatedExisting) {
      const msgAtomic = `[Payment] Order ${expanded.id} already processed (atomic upsert): ${orderDoc._id}`
      console.log(msgAtomic)
      logToDebugFile(msgAtomic)
      return { status: 'already_processed', orderId: orderDoc._id }
    }

    const msgNew = `[Payment] New order created via ${source}. OrderID: ${orderDoc._id}. Starting ticket generation...`
    console.log(msgNew)
    logToDebugFile(msgNew)

    // Dubbele check: als er op magische wijze toch 2 orders zijn (race condition zonder unieke index)
    // dan willen we niet OOK nog tickets maken voor de tweede.
    const allOrders = await Order.find({ stripeSessionId: expanded.id }).sort({ _id: 1 })
    if (allOrders.length > 1) {
      const master = allOrders[0]
      const isMaster = String(master._id) === String(orderDoc._id)

      const msgCrit = `[Payment] CRITICAL: Multiple orders detected for session ${expanded.id}. Count: ${allOrders.length}. Am I master? ${isMaster}`
      console.error(msgCrit)
      logToDebugFile(msgCrit)

      if (!isMaster) {
        logToDebugFile(`[Payment] I am a duplicate (Master: ${master._id}). Deleting myself (${orderDoc._id}) and aborting.`)
        // Verwijder deze duplicaat order direct om DB schoon te houden
        await Order.findByIdAndDelete(orderDoc._id).catch(e => console.error('Delete duplicate failed', e))
        return { status: 'already_processed', orderId: master._id }
      }

      logToDebugFile(`[Payment] I am the master (${orderDoc._id}). Proceeding with ticket generation.`)
    }

    // Als we hier zijn, is de order NET aangemaakt. Maak tickets en stuur mail.
    // START FIX: Email Lock & Global Check
    // Eerst controleren of er AL een email is verstuurd voor deze sessie (zelfs via een ander order-ID)
    const alreadySent = await Order.findOne({ stripeSessionId: expanded.id, emailSent: true });
    if (alreadySent) {
      const msgSent = `[Payment] Email already sent for session ${expanded.id} (via Order ${alreadySent._id}). Skipping email for ${orderDoc._id}.`;
      console.log(msgSent);
      logToDebugFile(msgSent);
      return { status: 'processed', orderId: orderDoc._id, ticketsCount: 0, message: 'Email already sent' };
    }

    // Probeer de lock te verkrijgen op de huidige order
    const lockedOrder = await Order.findOneAndUpdate(
      { _id: orderDoc._id, emailSent: false },
      { $set: { emailSent: true } },
      { new: true }
    );

    if (!lockedOrder) {
      const msgLock = `[Payment] Could not acquire email lock for Order ${orderDoc._id}. Email likely already being sent.`;
      console.log(msgLock);
      logToDebugFile(msgLock);
      return { status: 'processed', orderId: orderDoc._id, ticketsCount: 0, message: 'Email lock failed' };
    }
    // END FIX: Email Lock

    const tickets = []
    for (const li of items) {
      const qty = Math.max(0, Number(li.quantity) || 0)
      for (let i = 0; i < qty; i++) {
        let token = crypto.randomBytes(4).toString('hex')
        try {
          let tries = 0
          while (tries < 5) {
            const exists = await Ticket.findOne({ token }).lean()
            if (!exists) break
            token = crypto.randomBytes(4).toString('hex')
            tries++
          }
        } catch (_) { }

        const ticket = await Ticket.create({
          event: eventDoc._id,
          order: orderDoc._id,
          attendeeEmail: orderDoc.customerEmail,
          ticketTypeName: li.typeName,
          token,
        })
        console.log(`[Payment] Ticket created: ${ticket.token} for Order ${orderDoc._id}`)
        tickets.push({ token: ticket.token, ticketTypeName: ticket.ticketTypeName })
      }
    }

    try {
      const msgMail = `[Payment] Sending email to ${orderDoc.customerEmail} with ${tickets.length} tickets.`
      console.log(msgMail)
      logToDebugFile(msgMail)
      await sendTicketsEmail({
        to: orderDoc.customerEmail,
        event: { title: eventDoc.title, location: eventDoc.location, date: eventDoc.date },
        tickets,
        order: {
          amountCents: orderDoc.amountTotal,
          currency: (orderDoc.currency || 'eur').toUpperCase(),
          items,
        },
      })
      console.log('[Payment] Email sent successfully.')
      logToDebugFile('[Payment] Email sent successfully.')
    } catch (mailErr) {
      console.error('E-mail verzenden mislukt:', mailErr)
      logToDebugFile(`[Payment] Email error: ${mailErr.message}`)
      // Reset lock zodat we het later nog eens kunnen proberen
      await Order.findByIdAndUpdate(orderDoc._id, { emailSent: false });
    }

    return { status: 'processed', orderId: orderDoc._id, ticketsCount: tickets.length }
  } catch (err) {
    console.error('processPaidSession error:', err)
    // Check op duplicate key error (code 11000)
    if (err.code === 11000 || err.message?.includes('duplicate key')) {
      const msgDup = '[Payment] Caught duplicate key error (race condition). Order already exists.'
      console.log(msgDup)
      logToDebugFile(msgDup)
      return { status: 'already_processed' };
    }
    logToDebugFile(`[Payment] Fatal Error: ${err.message}`)
    return { status: 'error', error: err?.message || String(err) };
  }
}

export const confirmCheckoutSession = async (req, res) => {
  try {
    const s = getStripe()
    if (!s) return res.status(500).json({ error: 'Stripe is not configured' })
    const { sessionId } = req.params
    if (!sessionId) return res.status(400).json({ error: 'sessionId ontbreekt' })
    const expanded = await s.checkout.sessions.retrieve(String(sessionId), { expand: ['line_items'] })
    if (!expanded || expanded.status !== 'complete') {
      // Stripe kan ook 'open' of 'expired' teruggeven; alleen bij complete verwerken
      return res.status(400).json({ error: 'Sessiestatus niet voltooid', status: expanded?.status })
    }
    const result = await processPaidSession(expanded, 'client-confirm')
    return res.json(result)
  } catch (err) {
    console.error('confirmCheckoutSession error:', err)
    return res.status(500).json({ error: 'Kon sessie niet bevestigen' })
  }
}
