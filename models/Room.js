const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  hostelBlock: { type: String, required: true },
  capacity: { type: Number, required: true },
  occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'under_maintenance'],
    default: 'available'
  },
  facilities: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
