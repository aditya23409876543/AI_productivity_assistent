const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  dueDate: Date,
  completed: {
    type: Boolean,
    default: false,
  },
  aiPriority: {
    type: String,
    enum: ['High', 'Medium', 'Low', 'Unassigned'],
    default: 'Unassigned',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Task', taskSchema);
