const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  summary: { type: String },
  insights: { type: String },  // JSON string of { keyTopics, actionItems, questions }
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);
