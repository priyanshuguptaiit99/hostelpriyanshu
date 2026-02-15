const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  meals: {
    breakfast: { consumed: Number, missed: Number, rate: Number },
    lunch: { consumed: Number, missed: Number, rate: Number },
    dinner: { consumed: Number, missed: Number, rate: Number }
  },
  extraCharges: [{ description: String, amount: Number }],
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidDate: Date,
  generatedAt: { type: Date, default: Date.now }
});

billingSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Billing', billingSchema);
