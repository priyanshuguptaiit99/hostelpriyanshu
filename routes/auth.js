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

    // Determine approval status based on role
    let approvalStatus = 'pending';
    let message = 'Registration successful. ';
    
    if (role === 'admin') {
      // Admins cannot self-register
      return res.status(403).json({
        success: false,
        message: 'Admin accounts can only be created by existing admins'
      });
    } else if (role === 'warden') {
      message += 'Your account is pending admin approval. You will be notified once approved.';
    } else if (role === 'student') {
      approvalStatus = 'approved'; // Students are auto-approved
      message += 'Your account has been created successfully. You can now login.';
    } else {
      // mess_staff, maintenance_staff
      message += 'Your account is pending admin approval. You will be notified once approved.';
    }

    // Create user
    const user = await User.create({
      name,
      collegeId,
      email,
      password,
      role: role || 'student',
      approvalStatus,
      roomNumber,
      hostelBlock,
      department,
      year,
      phoneNumber
    });

    res.status(201).json({ 
      success: true, 
      message,
      user: {
        id: user._id,
        name: user.name,
        collegeId: user.collegeId,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus
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

    // Check approval status
    if (user.approvalStatus === 'pending') {
      let message = 'Your account is pending approval. ';
      if (user.role === 'warden') {
        message += 'Please wait for admin approval.';
      } else {
        message += 'Please wait for admin approval.';
      }
      return res.status(403).json({
        success: false,
        message,
        approvalStatus: 'pending'
      });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: user.rejectionReason || 'Your account has been rejected. Please contact administration.',
        approvalStatus: 'rejected'
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
        approvalStatus: user.approvalStatus,
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


// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=profile email`;
    res.json({ success: true, url: googleAuthUrl });
});

// @route   POST /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.post('/google/callback', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            return res.status(400).json({
                success: false,
                message: 'Failed to get access token'
            });
        }

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const googleUser = await userInfoResponse.json();

        // Check if user exists
        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            // Create new user
            const emailPrefix = googleUser.email.split('@')[0];
            const collegeId = emailPrefix.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) + Date.now().toString().slice(-4);

            user = await User.create({
                name: googleUser.name,
                email: googleUser.email,
                collegeId: collegeId,
                password: 'google-oauth-' + Math.random().toString(36).substring(7),
                role: 'student',
                googleId: googleUser.id,
                avatar: googleUser.picture,
                isActive: true
            });
        } else if (!user.googleId) {
            // Link Google account to existing user
            user.googleId = googleUser.id;
            user.avatar = googleUser.picture;
            await user.save();
        }

        // Generate JWT token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Google login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                collegeId: user.collegeId,
                role: user.role,
                avatar: user.avatar,
                roomNumber: user.roomNumber,
                hostelBlock: user.hostelBlock,
                department: user.department,
                year: user.year,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error('Google OAuth Error:', error);
        res.status(500).json({
            success: false,
            message: 'Google authentication failed',
            error: error.message
        });
    }
});


// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/users', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    const { role, approvalStatus, search } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { collegeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});
