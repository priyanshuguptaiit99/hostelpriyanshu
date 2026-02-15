const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Billing = require('../models/Billing');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const Announcement = require('../models/Announcement');
const { protect } = require('../middleware/auth');

// Student Dashboard
router.get('/student', protect, async (req, res) => {
  try {
    const studentId = req.user._id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get current month attendance
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const attendance = await Attendance.find({
      studentId,
      date: { $gte: startDate }
    });

    // Get current month bill
    const bill = await Billing.findOne({
      studentId,
      month: currentMonth,
      year: currentYear
    });

    // Get active complaints
    const complaints = await Complaint.find({
      studentId,
      status: { $ne: 'completed' }
    }).sort({ createdAt: -1 }).limit(5);

    // Get recent announcements
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { targetBlocks: { $size: 0 } },
        { targetBlocks: req.user.hostelBlock }
      ]
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        user: req.user,
        attendance: {
          present: attendance.filter(a => a.status === 'present').length,
          absent: attendance.filter(a => a.status === 'absent').length,
          total: attendance.length
        },
        bill,
        complaints,
        announcements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Warden Dashboard
router.get('/warden', protect, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Total students
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Today's attendance summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.find({ date: today });

    // Pending complaints
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

    // Recent feedback
    const recentFeedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('studentId', 'name roomNumber');

    // Billing summary
    const billingSummary = await Billing.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: {
        _id: null,
        totalAmount: { $sum: '$totalAmount' },
        paidAmount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
        pendingCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } }
      }}
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        todayAttendance: {
          present: todayAttendance.filter(a => a.status === 'present').length,
          absent: todayAttendance.filter(a => a.status === 'absent').length,
          total: todayAttendance.length
        },
        pendingComplaints,
        recentFeedback,
        billingSummary: billingSummary[0] || { totalAmount: 0, paidAmount: 0, pendingCount: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mess Staff Dashboard
router.get('/mess', protect, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Daily meal count (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({
      date: today,
      status: { $in: ['present', 'late_entry'] }
    });

    // Weekly ratings
    const weeklyRatings = await Feedback.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: '$mealType',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }}
    ]);

    // Recent feedback
    const recentFeedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('studentId', 'name roomNumber');

    res.json({
      success: true,
      data: {
        todayMealCount: todayAttendance,
        weeklyRatings,
        recentFeedback
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Maintenance Staff Dashboard
router.get('/maintenance', protect, async (req, res) => {
  try {
    // Assigned complaints
    const assignedComplaints = await Complaint.find({
      assignedTo: req.user._id
    }).populate('studentId', 'name roomNumber hostelBlock').sort({ createdAt: -1 });

    // Work statistics
    const stats = {
      pending: assignedComplaints.filter(c => c.status === 'pending').length,
      inProgress: assignedComplaints.filter(c => c.status === 'in_progress').length,
      completed: assignedComplaints.filter(c => c.status === 'completed').length
    };

    res.json({
      success: true,
      data: {
        assignedComplaints,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
