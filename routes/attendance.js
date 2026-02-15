const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect, authorize, validateAttendanceOwnership } = require('../middleware/auth');

// @route   POST /api/attendance/mark
// @desc    Mark attendance (Student can mark own, Warden can mark for anyone)
// @access  Private
router.post('/mark', protect, validateAttendanceOwnership, async (req, res) => {
  try {
    const { studentId, date, status, remarks } = req.body;
    
    // Use logged-in user's ID if student
    const targetStudentId = req.user.role === 'student' ? req.user._id : studentId;
    
    if (!targetStudentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }

    // Verify student exists
    const student = await User.findById(targetStudentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Normalize date to remove time component
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      studentId: targetStudentId,
      date: attendanceDate
    });

    if (existingAttendance) {
      // If student is trying to mark again, block it
      if (req.user.role === 'student') {
        return res.status(400).json({ 
          success: false, 
          message: 'Attendance already marked for today. You can only mark attendance once per day.',
          attendance: existingAttendance
        });
      }
      
      // If warden, allow update
      if (req.user.role === 'warden') {
        existingAttendance.status = status || existingAttendance.status;
        existingAttendance.remarks = remarks || existingAttendance.remarks;
        existingAttendance.isEdited = true;
        existingAttendance.editedBy = req.user._id;
        existingAttendance.editedAt = new Date();
        await existingAttendance.save();
        
        return res.json({
          success: true,
          message: 'Attendance updated successfully',
          attendance: existingAttendance
        });
      }
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      studentId: targetStudentId,
      date: attendanceDate,
      status: status || 'present',
      remarks,
      markedBy: req.user._id
    });

    // Populate student details
    await attendance.populate('studentId', 'name collegeId roomNumber');

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance already marked for this date' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error marking attendance',
      error: error.message 
    });
  }
});

// @route   GET /api/attendance/my
// @desc    Get my attendance records (Student only)
// @access  Private (Student)
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    
    let query = { studentId: req.user._id };
    
    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (month && year) {
      // Filter by specific month
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      query.date = { $gte: start, $lte: end };
    } else {
      // Default to current month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('markedBy', 'name role');

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      leave: attendance.filter(a => a.status === 'leave').length
    };

    res.json({
      success: true,
      count: attendance.length,
      stats,
      attendance
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching attendance',
      error: error.message 
    });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance for specific student (Warden only)
// @access  Private (Warden)
router.get('/student/:studentId', protect, authorize('warden'), async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    
    let query = { studentId: req.params.studentId };
    
    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('studentId', 'name collegeId roomNumber')
      .populate('markedBy', 'name role');

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      leave: attendance.filter(a => a.status === 'leave').length
    };

    res.json({
      success: true,
      count: attendance.length,
      stats,
      attendance
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching attendance',
      error: error.message 
    });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance (Warden only)
// @access  Private (Warden)
router.get('/today', protect, authorize('warden'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({ date: today })
      .populate('studentId', 'name collegeId roomNumber hostelBlock')
      .sort({ markedAt: -1 });

    // Get total students
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });

    const stats = {
      totalStudents,
      marked: attendance.length,
      notMarked: totalStudents - attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      leave: attendance.filter(a => a.status === 'leave').length
    };

    res.json({
      success: true,
      date: today,
      stats,
      attendance
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching today\'s attendance',
      error: error.message 
    });
  }
});

// @route   GET /api/attendance/report
// @desc    Get attendance report (Warden only)
// @access  Private (Warden)
router.get('/report', protect, authorize('warden'), async (req, res) => {
  try {
    const { month, year, roomNumber, hostelBlock } = req.query;
    
    // Default to current month
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Build student query
    let studentQuery = { role: 'student', isActive: true };
    if (roomNumber) studentQuery.roomNumber = roomNumber;
    if (hostelBlock) studentQuery.hostelBlock = hostelBlock;

    // Get all students
    const students = await User.find(studentQuery).select('name collegeId roomNumber hostelBlock');

    // Get attendance for all students
    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    });

    // Build report
    const report = students.map(student => {
      const studentAttendance = attendanceRecords.filter(
        a => a.studentId.toString() === student._id.toString()
      );

      return {
        student: {
          id: student._id,
          name: student.name,
          collegeId: student.collegeId,
          roomNumber: student.roomNumber,
          hostelBlock: student.hostelBlock
        },
        attendance: {
          total: studentAttendance.length,
          present: studentAttendance.filter(a => a.status === 'present').length,
          absent: studentAttendance.filter(a => a.status === 'absent').length,
          late: studentAttendance.filter(a => a.status === 'late').length,
          leave: studentAttendance.filter(a => a.status === 'leave').length,
          percentage: studentAttendance.length > 0 
            ? ((studentAttendance.filter(a => a.status === 'present').length / studentAttendance.length) * 100).toFixed(2)
            : 0
        }
      };
    });

    res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      totalStudents: students.length,
      report
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating report',
      error: error.message 
    });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance (Warden only)
// @access  Private (Warden)
router.put('/:id', protect, authorize('warden'), async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attendance record not found' 
      });
    }

    // Update fields
    if (status) attendance.status = status;
    if (remarks !== undefined) attendance.remarks = remarks;
    attendance.isEdited = true;
    attendance.editedBy = req.user._id;
    attendance.editedAt = new Date();

    await attendance.save();

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating attendance',
      error: error.message 
    });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance (Warden only)
// @access  Private (Warden)
router.delete('/:id', protect, authorize('warden'), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attendance record not found' 
      });
    }

    res.json({
      success: true,
      message: 'Attendance deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting attendance',
      error: error.message 
    });
  }
});

module.exports = router;
