// backend/index.js (ESM)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import eventRouter from './router/eventRouter.js';
import organizerRouter from './router/organizerRouter.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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


app.use('/api/events', eventRouter);
app.use('/api/organizers', organizerRouter);

// Health endpoint voor snelle check
app.get('/api/health', (_req, res) => {
  const state = mongoose.connection.readyState; // 0:disconnected 1:connected
  res.json({ ok: true, db: state === 1 ? 'connected' : 'not_connected' });
});

// app.get('/api/health', (_req, res) => {
//   res.json({ ok: true });
// });

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
// ... existing code ...

