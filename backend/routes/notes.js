const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({}, 'summary createdAt').sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { content, summary, insights } = req.body;
  const note = new Note({ content, summary, insights });
  try {
    const newNote = await note.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Cannot find note' });
    await note.deleteOne();
    res.json({ message: 'Deleted Note' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
