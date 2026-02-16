const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/attendance-approval/mark
// @desc    Student marks their attendance
// @access  Private/Student
router.post('/mark', protect, authorize('student'), async (req, res) => {
  try {
    const { date, remarks } = req.body;
    const studentId = req.user._id;

    // Check if student is approved
    if (req.user.approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account must be approved before marking attendance'
      });
    }

    // Get today's date if not provided
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already marked for today
    const existingAttendance = await Attendance.findOne({
      studentId,
      date: attendanceDate
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date',
        status: existingAttendance.approvalStatus
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      studentId,
      hostelId: req.user.hostelId,
      date: attendanceDate,
      approvalStatus: 'pending',
      status: 'present',
      markedBy: studentId,
      remarks
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully. Waiting for warden approval.',
      data: attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance-approval/my-attendance
// @desc    Get student's own attendance records
// @access  Private/Student
router.get('/my-attendance', protect, authorize('student'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const studentId = req.user._id;

    let filter = { studentId };

    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(filter)
      .populate('approvedBy', 'name email')
      .sort({ date: -1 });

    // Calculate statistics
    const stats = {
      total: attendance.length,
      approved: attendance.filter(a => a.approvalStatus === 'approved').length,
      pending: attendance.filter(a => a.approvalStatus === 'pending').length,
      rejected: attendance.filter(a => a.approvalStatus === 'rejected').length
    };

    res.json({
      success: true,
      stats,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance-approval/pending
// @desc    Get pending attendance requests for warden
// @access  Private/Warden
router.get('/pending', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const { date } = req.query;

    let filter = { approvalStatus: 'pending' };

    // Filter by specific date if provided
    if (date) {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      filter.date = attendanceDate;
    }

    const pendingAttendance = await Attendance.find(filter)
      .populate('studentId', 'name collegeId email roomNumber hostelBlock')
      .populate('hostelId', 'hostelName')
      .sort({ date: -1, markedAt: 1 });

    res.json({
      success: true,
      count: pendingAttendance.length,
      data: pendingAttendance
    });
  } catch (error) {
    console.error('Error fetching pending attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending attendance',
      error: error.message
    });
  }
});

// @route   PUT /api/attendance-approval/approve/:id
// @desc    Approve attendance (Warden only)
// @access  Private/Warden
router.put('/approve/:id', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (attendance.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Attendance is not pending approval'
      });
    }

    attendance.approvalStatus = 'approved';
    attendance.approvedBy = req.user._id;
    attendance.approvedAt = new Date();
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('studentId', 'name collegeId email')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: 'Attendance approved successfully',
      data: populatedAttendance
    });
  } catch (error) {
    console.error('Error approving attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving attendance',
      error: error.message
    });
  }
});

// @route   PUT /api/attendance-approval/reject/:id
// @desc    Reject attendance (Warden only)
// @access  Private/Warden
router.put('/reject/:id', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (attendance.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Attendance is not pending approval'
      });
    }

    attendance.approvalStatus = 'rejected';
    attendance.approvedBy = req.user._id;
    attendance.approvedAt = new Date();
    attendance.rejectionReason = reason || 'Rejected by warden';
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('studentId', 'name collegeId email')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: 'Attendance rejected',
      data: populatedAttendance
    });
  } catch (error) {
    console.error('Error rejecting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance-approval/student/:studentId
// @desc    Get attendance for specific student (Warden/Admin)
// @access  Private/Warden/Admin
router.get('/student/:studentId', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const { month, year, status } = req.query;
    
    let filter = { studentId: req.params.studentId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      filter.approvalStatus = status;
    }

    const attendance = await Attendance.find(filter)
      .populate('approvedBy', 'name email')
      .sort({ date: -1 });

    const stats = {
      total: attendance.length,
      approved: attendance.filter(a => a.approvalStatus === 'approved').length,
      pending: attendance.filter(a => a.approvalStatus === 'pending').length,
      rejected: attendance.filter(a => a.approvalStatus === 'rejected').length
    };

    res.json({
      success: true,
      stats,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student attendance',
      error: error.message
    });
  }
});

// @route   GET /api/attendance-approval/statistics
// @desc    Get attendance statistics (Warden/Admin)
// @access  Private/Warden/Admin
router.get('/statistics', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const { date } = req.query;
    
    let filter = {};
    if (date) {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      filter.date = attendanceDate;
    }

    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
