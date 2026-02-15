const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['general', 'mess', 'maintenance', 'emergency'],
    default: 'general'
  },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetHostels: [String],
  targetBlocks: [String],
  scheduledFor: Date,
  isActive: { type: Boolean, default: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
