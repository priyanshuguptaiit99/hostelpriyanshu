const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  hostelName: {
    type: String,
    required: [true, 'Hostel name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0
  },
  assignedWarden: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
hostelSchema.index({ hostelName: 1 });
hostelSchema.index({ assignedWarden: 1 });

module.exports = mongoose.model('Hostel', hostelSchema);
