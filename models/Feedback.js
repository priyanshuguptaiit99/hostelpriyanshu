const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  isAnonymous: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
