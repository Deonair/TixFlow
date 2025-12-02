// backend/index.js (ESM)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import eventRouter from './router/eventRouter.js';
import organizerRouter from './router/organizerRouter.js';
import paymentRouter from './router/paymentRouter.js';
import orderRouter from './router/orderRouter.js';
import ticketRouter from './router/ticketRouter.js';
import { handleStripeWebhook } from './controller/paymentController.js';
import { buildEmailHtmlAndAttachments } from './services/emailService.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5050;

// DB connectie: gebruik MONGO_URI uit env; geen localhost fallback in containers
const uri = process.env.MONGO_URI ?? 'mongodb://localhost:27017/tixflow';

// Verbinden met MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


// Vertrouw proxy (IIS) zodat secure cookies correct werken
app.set('trust proxy', 1);

// Server-side sessies met Mongo store
const sessionSecret = process.env.SESSION_SECRET || 'change-this-in-production';
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: uri, ttl: 60 * 60 * 24 * 7 }),
  proxy: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: 'auto'
  }
}));


// Stripe webhook: moet raw body gebruiken voor signature verificatie
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
// JSON parser voor alle andere routes
app.use(express.json());
// Routes met JSON body parsing
app.use('/api/events', eventRouter);
// Organizers hernoemd naar users: mount onder /api/users
app.use('/api/users', organizerRouter);
// Payments API
app.use('/api/payments', paymentRouter);
// Orders & stats
app.use('/api', orderRouter);
// Tickets verify/redeem
app.use('/api', ticketRouter);

// Health endpoint voor snelle check
app.get('/api/health', (_req, res) => {
  const state = mongoose.connection.readyState; // 0:disconnected 1:connected
  res.json({ ok: true, db: state === 1 ? 'connected' : 'not_connected' });
});

// Preview endpoint om e-mail HTML snel te bekijken in de browser
app.get('/api/preview/email', async (_req, res) => {
  try {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173'
    const sampleEvent = {
      title: 'Deo Diddy Party',
      location: 'Amsterdam',
      date: new Date().toISOString(),
    }
    const sampleTickets = [
      { ticketTypeName: 'Staan', token: 'demo1a2b3c' },
      { ticketTypeName: 'Zit', token: 'demo4d5e6f' },
    ]
    const sampleOrder = {
      amountCents: 12900,
      currency: 'EUR',
      items: [
        { name: 'Staan – deo-diddy-party', unitAmount: 3900, quantity: 2 },
        { name: 'Zit – deo-diddy-party', unitAmount: 5100, quantity: 1 },
      ],
    }
    const { html } = await buildEmailHtmlAndAttachments({ event: sampleEvent, tickets: sampleTickets, order: sampleOrder, baseUrl })
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (err) {
    res.status(500).send(`<pre>Preview error: ${err?.message}</pre>`)
  }
})

// Preview endpoint om een voorbeeld-PDF van een ticket te downloaden/bekijken
app.get('/api/preview/pdf', async (_req, res) => {
  try {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173'
    const sampleEvent = {
      title: 'Deo Diddy Party',
      location: 'Amsterdam',
      date: new Date().toISOString(),
    }
    const sampleTickets = [
      { ticketTypeName: 'Staan', token: 'demo1a' },
    ]
    const { attachments } = await buildEmailHtmlAndAttachments({ event: sampleEvent, tickets: sampleTickets, order: null, baseUrl })
    const first = attachments?.[0]
    if (!first) return res.status(500).send('Geen bijlage gegenereerd')
    const buf = Buffer.from(String(first.content || ''), 'base64')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${first.filename || 'ticket.pdf'}"`)
    res.send(buf)
  } catch (err) {
    res.status(500).send(`<pre>PDF preview error: ${err?.message}</pre>`)
  }
})

// app.get('/api/health', (_req, res) => {
//   res.json({ ok: true });
// });

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
// ... existing code ...
