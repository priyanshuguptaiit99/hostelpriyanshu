const express = require('express');
const router = express.Router();
const MessRate = require('../models/MessRate');
const MessBill = require('../models/MessBill');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/mess-rate
// @desc    Set mess rate for a month (Warden only)
// @access  Private (Warden)
router.post('/', protect, authorize('warden'), async (req, res) => {
  try {
    const { month, year, dailyRate, monthlyFixedRate, mealRates, remarks } = req.body;

    if (!month || !year || !dailyRate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month, year, and daily rate are required' 
      });
    }

    // Check if rate already exists
    const existingRate = await MessRate.findOne({ month, year });
    if (existingRate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rate already exists for this month. Use update endpoint.',
        rate: existingRate
      });
    }

    // Create rate
    const rate = await MessRate.create({
      month,
      year,
      dailyRate,
      monthlyFixedRate: monthlyFixedRate || 0,
      mealRates: mealRates || { breakfast: 30, lunch: 50, dinner: 50 },
      setBy: req.user._id,
      remarks
    });

    res.status(201).json({
      success: true,
      message: 'Mess rate set successfully',
      rate
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error setting mess rate',
      error: error.message 
    });
  }
});

// @route   GET /api/mess-rate/current
// @desc    Get current month's mess rate
// @access  Private
router.get('/current', protect, async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month || now.getMonth() + 1;
    const year = req.query.year || now.getFullYear();

    const rate = await MessRate.getCurrentRate(month, year);

    res.json({
      success: true,
      rate
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching mess rate',
      error: error.message 
    });
  }
});

// @route   GET /api/mess-rate
// @desc    Get all mess rates (Warden only)
// @access  Private (Warden)
router.get('/', protect, authorize('warden'), async (req, res) => {
  try {
    const rates = await MessRate.find()
      .sort({ year: -1, month: -1 })
      .populate('setBy', 'name role');

    res.json({
      success: true,
      count: rates.length,
      rates
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching mess rates',
      error: error.message 
    });
  }
});

// @route   PUT /api/mess-rate/:id
// @desc    Update mess rate (Warden only)
// @access  Private (Warden)
router.put('/:id', protect, authorize('warden'), async (req, res) => {
  try {
    const { dailyRate, monthlyFixedRate, mealRates, remarks, isActive } = req.body;

    const rate = await MessRate.findById(req.params.id);
    
    if (!rate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mess rate not found' 
      });
    }

    // Update fields
    if (dailyRate !== undefined) rate.dailyRate = dailyRate;
    if (monthlyFixedRate !== undefined) rate.monthlyFixedRate = monthlyFixedRate;
    if (mealRates) rate.mealRates = mealRates;
    if (remarks !== undefined) rate.remarks = remarks;
    if (isActive !== undefined) rate.isActive = isActive;

    await rate.save();

    // If rate changed, update all bills for this month
    if (dailyRate !== undefined) {
      const bills = await MessBill.find({ 
        month: rate.month, 
        year: rate.year 
      });

      for (const bill of bills) {
        bill.rate = dailyRate;
        bill.calculateTotal();
        await bill.save();
      }
    }

    res.json({
      success: true,
      message: 'Mess rate updated successfully. All bills recalculated.',
      rate
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating mess rate',
      error: error.message 
    });
  }
});

// @route   DELETE /api/mess-rate/:id
// @desc    Delete mess rate (Warden only)
// @access  Private (Warden)
router.delete('/:id', protect, authorize('warden'), async (req, res) => {
  try {
    const rate = await MessRate.findByIdAndDelete(req.params.id);
    
    if (!rate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mess rate not found' 
      });
    }

    res.json({
      success: true,
      message: 'Mess rate deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting mess rate',
      error: error.message 
    });
  }
});

module.exports = router;
