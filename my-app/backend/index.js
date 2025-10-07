// backend/index.js (ESM)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import eventRouter from './router/eventRouter.js';   // ← import je router

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tixflow';

await mongoose.connect(MONGO_URI);
console.log('MongoDB connected');
// index.js
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});


app.use('/api/events', eventRouter);

// app.get('/api/health', (_req, res) => {
//   res.json({ ok: true });
// });

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

await mongoose.connect(MONGO_URI);
console.log(`✅ Connected to: ${MONGO_URI}`);
