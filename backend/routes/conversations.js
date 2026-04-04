const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// GET all conversations (summary - no messages for performance)
router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.find({}, 'title createdAt updatedAt').sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single conversation with all messages
router.get('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new conversation
router.post('/', async (req, res) => {
  try {
    const conversation = new Conversation({
      title: req.body.title || 'New Chat',
      messages: req.body.messages || []
    });
    const saved = await conversation.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH append messages + update title
router.patch('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (req.body.messages) {
      conversation.messages = req.body.messages;
    }
    if (req.body.title) {
      conversation.title = req.body.title;
    }
    conversation.updatedAt = new Date();
    const updated = await conversation.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE conversation
router.delete('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    await conversation.deleteOne();
    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
