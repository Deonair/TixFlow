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

const PORT = process.env.PORT || 5050;
import mongoose from 'mongoose';

// ⬇️ Dit toevoegen bovenaan de connectie:
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/tixflow';

// Verbinden met MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


app.use('/api/events', eventRouter);

// app.get('/api/health', (_req, res) => {
//   res.json({ ok: true });
// });

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
// ... existing code ...

