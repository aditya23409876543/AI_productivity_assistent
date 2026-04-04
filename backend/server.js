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
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// For local development without MongoDB setup yet, we can either throw an error or handle it.
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGODB_URI not found in .env. Running without DB connection (Expect API errors).');
}

app.use('/api/tasks', tasksRouter);
app.use('/api/notes', notesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/events', eventsRouter);

app.get('/', (req, res) => {
  res.send('AI Productivity Assistant Backend is running');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
