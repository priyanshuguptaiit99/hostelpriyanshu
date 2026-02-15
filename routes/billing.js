const express = require('express');
const router = express.Router();
const Billing = require('../models/Billing');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

// Generate monthly bill (Warden/Admin only)
router.post('/generate', protect, authorize('warden', 'mess_staff'), async (req, res) => {
  try {
    const { studentId, month, year, mealRates, extraCharges } = req.body;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const attendance = await Attendance.find({
      studentId,
      date: { $gte: startDate, $lte: endDate }
    });

    const daysInMonth = endDate.getDate();
    const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'late_entry').length;
    const absentDays = daysInMonth - presentDays;

    const meals = {
      breakfast: {
        consumed: presentDays,
        missed: absentDays,
        rate: mealRates.breakfast || 30
      },
      lunch: {
        consumed: presentDays,
        missed: absentDays,
        rate: mealRates.lunch || 50
      },
      dinner: {
        consumed: presentDays,
        missed: absentDays,
        rate: mealRates.dinner || 50
      }
    };

    const mealTotal = 
      (meals.breakfast.consumed * meals.breakfast.rate) +
      (meals.lunch.consumed * meals.lunch.rate) +
      (meals.dinner.consumed * meals.dinner.rate);

    const extraTotal = extraCharges ? extraCharges.reduce((sum, charge) => sum + charge.amount, 0) : 0;
    const totalAmount = mealTotal + extraTotal;

    const billing = await Billing.create({
      studentId, month, year, meals, extraCharges, totalAmount
    });

    res.status(201).json({ success: true, data: billing });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Bill already generated for this month' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get student bills
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const bills = await Billing.find({ studentId: req.params.studentId }).sort({ year: -1, month: -1 });
    res.json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get specific bill
router.get('/:id', protect, async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id).populate('studentId', 'name email roomNumber');
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update payment status
router.put('/:id/payment', protect, async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    bill.paymentStatus = 'paid';
    bill.paidDate = new Date();
    await bill.save();

    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get financial summary (Admin only)
router.get('/summary/:month/:year', protect, authorize('warden'), async (req, res) => {
  try {
    const { month, year } = req.params;
    
    const bills = await Billing.find({ month: parseInt(month), year: parseInt(year) });
    
    const summary = {
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      paidAmount: bills.filter(b => b.paymentStatus === 'paid').reduce((sum, bill) => sum + bill.totalAmount, 0),
      pendingAmount: bills.filter(b => b.paymentStatus === 'pending').reduce((sum, bill) => sum + bill.totalAmount, 0),
      paidCount: bills.filter(b => b.paymentStatus === 'paid').length,
      pendingCount: bills.filter(b => b.paymentStatus === 'pending').length
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
