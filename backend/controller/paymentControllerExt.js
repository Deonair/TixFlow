// backend/controller/paymentControllerExt.js
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config()

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

    const line_items = selections.map((sel) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: `${sel.name} – ${slug}` },
        unit_amount: Math.round((sel.price ?? 0) * 100),
      },
      quantity: Math.max(1, sel.qty ?? 0),
    }))

    const session = await s.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: customer?.email,
      client_reference_id: String(slug),
      metadata: { eventSlug: String(slug) },
      success_url: `http://localhost:5173/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/checkout/cancel`,
    })

    return res.json({ sessionId: session.id })
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
        const lineItems = expanded?.line_items?.data || []
        const clientRef = expanded.client_reference_id || expanded.metadata?.eventSlug
        try {
          const { default: Event } = await import('../models/eventModel.js')
          const { default: Order } = await import('../models/orderModel.js')
          const eventDoc = clientRef ? await Event.findOne({ slug: String(clientRef) }) : null
          if (!eventDoc) {
            console.warn('Webhook: event niet gevonden voor slug', clientRef)
            break
          }
          const items = lineItems.map(li => ({
            name: li.description,
            unitAmount: li.price?.unit_amount ?? 0,
            quantity: li.quantity ?? 0,
          }))
          const order = await Order.create({
            event: eventDoc._id,
            items,
            amountTotal: expanded.amount_total ?? 0,
            currency: expanded.currency || 'eur',
            customerEmail: expanded.customer_details?.email || expanded.customer_email || 'unknown@example.com',
            stripeSessionId: expanded.id,
            paymentIntentId: expanded.payment_intent ? String(expanded.payment_intent) : undefined,
            status: 'paid',
          })
          console.log('Order opgeslagen', order._id)
        } catch (saveErr) {
          console.error('Order opslaan mislukt:', saveErr)
        }
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

