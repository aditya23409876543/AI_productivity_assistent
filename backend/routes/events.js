const express = require('express');
const router = express.Router();
const ScheduledEvent = require('../models/ScheduledEvent');

// GET all events (optionally filter by month: ?month=2026-04)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.month) {
      filter.date = { $regex: `^${req.query.month}` };
    }
    if (req.query.date) {
      filter.date = req.query.date;
    }
    const events = await ScheduledEvent.find(filter).sort({ date: 1, time: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create event
router.post('/', async (req, res) => {
  const { title, description, date, time, category, aiGenerated } = req.body;
  const event = new ScheduledEvent({ title, description, date, time, category, aiGenerated });
  try {
    const saved = await event.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST bulk create (for AI-generated daily plans)
router.post('/bulk', async (req, res) => {
  const { events } = req.body;
  try {
    const saved = await ScheduledEvent.insertMany(events);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH toggle complete / update
router.patch('/:id', async (req, res) => {
  try {
    const event = await ScheduledEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (req.body.completed !== undefined) event.completed = req.body.completed;
    if (req.body.title) event.title = req.body.title;
    if (req.body.time !== undefined) event.time = req.body.time;
    const updated = await event.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE event
router.delete('/:id', async (req, res) => {
  try {
    const event = await ScheduledEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
