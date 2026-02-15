const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');

// Submit feedback
router.post('/', protect, async (req, res) => {
  try {
    const { date, mealType, rating, comment, isAnonymous } = req.body;
    
    const feedback = await Feedback.create({
      studentId: req.user._id,
      date: new Date(date),
      mealType,
      rating,
      comment,
      isAnonymous
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get feedback by date range
router.get('/', protect, authorize('warden', 'mess_staff'), async (req, res) => {
  try {
    const { startDate, endDate, mealType } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    if (mealType) {
      query.mealType = mealType;
    }

    const feedback = await Feedback.find(query)
      .populate('studentId', 'name roomNumber')
      .sort({ date: -1 });

    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get rating analytics
router.get('/analytics', protect, authorize('warden', 'mess_staff'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const analytics = await Feedback.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: '$mealType',
        averageRating: { $avg: '$rating' },
        totalFeedback: { $sum: 1 },
        ratings: { $push: '$rating' }
      }}
    ]);

    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get low rating alerts
router.get('/alerts', protect, authorize('warden', 'mess_staff'), async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const alerts = await Feedback.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { mealType: '$mealType', date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
        averageRating: { $avg: '$rating' }
      }},
      { $match: { averageRating: { $lt: 3 } } },
      { $sort: { '_id.date': -1 } }
    ]);

    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
