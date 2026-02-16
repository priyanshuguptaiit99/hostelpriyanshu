const mongoose = require('mongoose');

const messRateSchema = new mongoose.Schema({
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
  dailyRate: {
    type: Number,
    required: true,
    default: 100
  },
  monthlyFixedRate: {
    type: Number,
    default: 0
  },
  mealRates: {
    breakfast: { type: Number, default: 30 },
    lunch: { type: Number, default: 50 },
    dinner: { type: Number, default: 50 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  setBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  remarks: String
}, {
  timestamps: true
});

// Compound index to ensure one rate per month/year
messRateSchema.index({ month: 1, year: 1 }, { unique: true });

// Static method to get current rate
messRateSchema.statics.getCurrentRate = async function(month, year) {
  const rate = await this.findOne({ 
    month: month || new Date().getMonth() + 1,
    year: year || new Date().getFullYear(),
    isActive: true
  });
  
  return rate || {
    dailyRate: 100,
    mealRates: { breakfast: 30, lunch: 50, dinner: 50 }
  };
};

module.exports = mongoose.model('MessRate', messRateSchema);
