const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, collegeId, email, password, role, roomNumber, hostelBlock, department, year, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !collegeId || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, college ID, email, and password' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { collegeId }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'College ID already registered' 
      });
    }

    // Validate student must have room number
    if (role === 'student' && !roomNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room number is required for students' 
      });
    }

    // Create user
    const user = await User.create({
      name,
      collegeId,
      email,
      password,
      role: role || 'student',
      roomNumber,
      hostelBlock,
      department,
      year,
      phoneNumber
    });

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful. You can now login.',
      user: {
        id: user._id,
        name: user.name,
        collegeId: user.collegeId,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed',
      error: error.message 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, collegeId, password } = req.body;

    // Validate input
    if ((!email && !collegeId) || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email/college ID and password' 
      });
    }

    // Find user by email or collegeId
    const user = await User.findOne({ 
      $or: [
        { email: email?.toLowerCase() }, 
        { collegeId: collegeId?.toUpperCase() }
      ] 
    }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Your account has been deactivated. Please contact admin.' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        collegeId: user.collegeId,
        email: user.email,
        role: user.role,
        roomNumber: user.roomNumber,
        hostelBlock: user.hostelBlock,
        department: user.department,
        year: user.year
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed',
      error: error.message 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        collegeId: user.collegeId,
        email: user.email,
        role: user.role,
        roomNumber: user.roomNumber,
        hostelBlock: user.hostelBlock,
        department: user.department,
        year: user.year,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user data',
      error: error.message 
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, phoneNumber, roomNumber } = req.body;
    
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (roomNumber && req.user.role === 'student') updateFields.roomNumber = roomNumber;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating profile',
      error: error.message 
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide current and new password' 
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error changing password',
      error: error.message 
    });
  }
});

module.exports = router;
