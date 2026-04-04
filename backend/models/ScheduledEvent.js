const mongoose = require('mongoose');

const scheduledEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, required: true }, // stored as 'YYYY-MM-DD' for easy querying
  time: { type: String, default: '' },    // optional "09:00"
  category: {
    type: String,
    enum: ['work', 'personal', 'health', 'learning', 'other'],
    default: 'work'
  },
  completed: { type: Boolean, default: false },
  aiGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScheduledEvent', scheduledEventSchema);
