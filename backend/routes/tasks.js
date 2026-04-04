const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

router.get('/', async (req, res) => {
  if (!process.env.MONGODB_URI) return res.status(500).json({ message: "MONGODB_URI is not configured." });
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { title, description, dueDate } = req.body;
  if (!process.env.MONGODB_URI) return res.status(500).json({ message: "MONGODB_URI is not configured." });

  const task = new Task({ title, description, dueDate });
  try {
    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  if (!process.env.MONGODB_URI) return res.status(500).json({ message: "MONGODB_URI is not configured." });

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Cannot find task' });

    if (req.body.title != null) task.title = req.body.title;
    if (req.body.description != null) task.description = req.body.description;
    if (req.body.completed != null) task.completed = req.body.completed;
    if (req.body.aiPriority != null) task.aiPriority = req.body.aiPriority;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  if (!process.env.MONGODB_URI) return res.status(500).json({ message: "MONGODB_URI is not configured." });
  
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Cannot find task' });
    await task.deleteOne();
    res.json({ message: 'Deleted Task' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
