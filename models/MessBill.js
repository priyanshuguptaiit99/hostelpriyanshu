const mongoose = require('mongoose');

const messBillSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  month: { 
    type: Number, 
    required: true,
    min: 1,
    max: 12
  },
  year: { 
    type: Number, 
    required: true
  },
  totalDays: { 
    type: Number, 
    required: true,
    default: 0
  },
  rate: { 
    type: Number, 
    required: true,
    default: 0
  },
  totalAmount: { 
    type: Number, 
    required: true,
    default: 0
  },
  breakdown: {
    breakfast: { days: Number, rate: Number, amount: Number },
    lunch: { days: Number, rate: Number, amount: Number },
    dinner: { days: Number, rate: Number, amount: Number }
  },
  extraCharges: [{
    description: String,
    amount: Number
  }],
  deductions: [{
    description: String,
    amount: Number
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paidDate: Date,
  generatedAt: { 
    type: Date, 
    default: Date.now 
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdated: Date
}, {
  timestamps: true
});

// Compound index to ensure one bill per student per month
messBillSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

// Method to calculate total amount
messBillSchema.methods.calculateTotal = function() {
  let total = this.totalDays * this.rate;
  
  // Add extra charges
  if (this.extraCharges && this.extraCharges.length > 0) {
    total += this.extraCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
  }
  
  // Subtract deductions
  if (this.deductions && this.deductions.length > 0) {
    total -= this.deductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0);
  }
  
  this.totalAmount = Math.max(0, total); // Ensure non-negative
  return this.totalAmount;
};

// Pre-save hook to calculate total
messBillSchema.pre('save', function(next) {
  if (this.isModified('totalDays') || this.isModified('rate') || 
      this.isModified('extraCharges') || this.isModified('deductions')) {
    this.calculateTotal();
    this.lastUpdated = new Date();
  }
  next();
});

module.exports = mongoose.model('MessBill', messBillSchema);
