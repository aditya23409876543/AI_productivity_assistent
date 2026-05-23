require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const tasksRouter = require('./routes/tasks');
const notesRouter = require('./routes/notes');
const aiRouter = require('./routes/ai');
const conversationsRouter = require('./routes/conversations');
const eventsRouter = require('./routes/events');

const app = express();

// ── CORS ──
// Allow requests from the Vercel frontend and local dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // set this in Vercel env vars to your Vercel domain
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin serverless)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// ── Serverless-safe MongoDB connection ──
// Caches the connection across warm Lambda invocations (prevents pool exhaustion)
let cachedConn = null;

async function connectDB() {
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set. DB operations will fail.');
    return null;
  }
  try {
    cachedConn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB');
    return cachedConn;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    cachedConn = null;
    return null;
  }
}

// Middleware: ensure DB is connected before every API request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ── Routes ──
app.use('/api/tasks', tasksRouter);
app.use('/api/notes', notesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/events', eventsRouter);

app.get('/', (req, res) => {
  res.json({ status: 'AI Productivity Assistant API is running' });
});

// ── Start server (only when running locally, NOT in serverless) ──
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
