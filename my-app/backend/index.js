// backend/index.js (ESM)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import eventRouter from './router/eventRouter.js';
import organizerRouter from './router/organizerRouter.js';
import paymentRouter from './router/paymentRouter.js';
import orderRouter from './router/orderRouter.js';
import ticketRouter from './router/ticketRouter.js';
import adminRouter from './router/adminRouter.js';
import { handleStripeWebhook } from './controller/paymentController.js';
import { buildEmailHtmlAndAttachments } from './services/emailService.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';

dotenv.config();

const app = express();
// CORS configuratie zodat cookies (sessies) meegestuurd worden vanaf de frontend
const appOrigin = process.env.APP_BASE_URL || 'http://localhost:5173';
app.use(cors({ origin: appOrigin, credentials: true }));

const PORT = process.env.PORT || 5050;

// DB connectie met dev-only in-memory fallback
const isProd = process.env.NODE_ENV === 'production';
let dbUri = isProd
  ? process.env.MONGO_URI
  : (process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/tixflow');
const prodFallback = process.env.PROD_IN_MEMORY_FALLBACK === 'true';
// Alleen als expliciet aangezet in dev gebruiken we in-memory
const preferMemory = process.env.USE_IN_MEMORY_MONGO === 'true';
const devFallback = process.env.DEV_IN_MEMORY_FALLBACK === 'true';
console.log('[BOOT] APP_BASE_URL:', appOrigin);
console.log('[BOOT] preferMemory:', preferMemory, 'NODE_ENV:', process.env.NODE_ENV);
// Mongoose v6+/Mongo driver v4+: verwijder deprecated opties
const connectOpts = { serverSelectionTimeoutMS: 3000 };

// In productie: vereis expliciete MONGO_URI
if (isProd && (!dbUri || dbUri.trim() === '')) {
  console.error('Missing MONGO_URI in production; refusing to start without a real database.');
  process.exit(1);
}

async function connectMongo() {
  // In dev: als expliciet aangezet, start in-memory
  if (!isProd && preferMemory) {
    console.warn('Using in-memory MongoDB for development');
    const mongod = await MongoMemoryServer.create();
    dbUri = mongod.getUri();
    await mongoose.connect(dbUri, connectOpts);
    console.log('Connected to in-memory MongoDB');
    return;
  }
  try {
    await mongoose.connect(dbUri, connectOpts);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Val alleen terug op in-memory in development als expliciet toegestaan
    if (!isProd) {
      if (preferMemory || devFallback) {
        console.warn('Starting in-memory MongoDB fallback after connection error (development)...');
        const mongod = await MongoMemoryServer.create();
        dbUri = mongod.getUri();
        await mongoose.connect(dbUri, connectOpts);
        console.log('Connected to in-memory MongoDB');
      } else {
        console.error('Development MongoDB connection failed; no fallback. Start je lokale mongod of zet DEV_IN_MEMORY_FALLBACK=true.');
        process.exit(1);
      }
    } else {
      if (prodFallback) {
        console.warn('Production MongoDB failed; falling back to in-memory due to PROD_IN_MEMORY_FALLBACK=true');
        const mongod = await MongoMemoryServer.create();
        dbUri = mongod.getUri();
        await mongoose.connect(dbUri, connectOpts);
        console.log('Connected to in-memory MongoDB (production fallback)');
      } else {
        console.error('Production MongoDB connection failed; exiting without in-memory fallback');
        process.exit(1);
      }
    }
  }
}

await connectMongo();


// Vertrouw proxy (IIS) zodat secure cookies correct werken
app.set('trust proxy', 1);

// Server-side sessies met Mongo store
const sessionSecret = process.env.SESSION_SECRET || 'change-this-in-production';
let sessionStore;
try {
  sessionStore = MongoStore.create({ mongoUrl: dbUri, ttl: 60 * 60 * 24 * 7 });
} catch (e) {
  console.warn('MongoStore init failed, falling back to MemoryStore:', e?.message);
  sessionStore = new session.MemoryStore();
}
const sameSite = (process.env.COOKIE_SAMESITE || 'lax');
const secureEnv = process.env.COOKIE_SECURE;
const secure = secureEnv === 'true' ? true : secureEnv === 'false' ? false : 'auto';
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  proxy: true,
  cookie: {
    httpOnly: true,
    sameSite,
    secure
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
// Admin (superadmin only)
// Superadmin routes
app.use('/api/admin', adminRouter);

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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
// ... existing code ...
