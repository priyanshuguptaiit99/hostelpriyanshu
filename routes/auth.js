const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/email');

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

    // Validate email domain - must be @nitj.ac.in
    if (!email.toLowerCase().endsWith('@nitj.ac.in')) {
      return res.status(400).json({
        success: false,
        message: 'Only NITJ college email addresses (@nitj.ac.in) are allowed'
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
      message += 'Please verify your college email to complete registration.';
    } else {
      // mess_staff, maintenance_staff
      message += 'Your account is pending admin approval. You will be notified once approved.';
    }

    // Create user (email not verified yet)
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
      phoneNumber,
      emailVerified: false // Email not verified yet
    });

    // Generate and send OTP
    const otp = user.generateEmailOTP();
    await user.save();

    // Send OTP email
    try {
      await sendEmail({
        email: user.email,
        subject: 'NITJ Hostel Management - Verify Your Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #667eea; text-align: center; margin-bottom: 20px;">🏠 NITJ Hostel Management</h2>
              <h3 style="color: #333; margin-bottom: 15px;">Welcome ${user.name}!</h3>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">Thank you for registering with NITJ Hostel Management System.</p>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">Please verify your college email address using the OTP below:</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #666; font-size: 14px; line-height: 1.6;"><strong>This OTP is valid for 10 minutes.</strong></p>
              <p style="color: #666; font-size: 14px; line-height: 1.6;">After verification, you can login to access the hostel management system.</p>
              <p style="color: #666; font-size: 14px; line-height: 1.6;">If you didn't register for this account, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">© 2026 NITJ Hostel Management System. All rights reserved.</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail registration if email fails, user can request OTP again
    }

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful! An OTP has been sent to your college email. Please verify to login.',
      requiresVerification: true,
      user: {
        id: user._id,
        name: user.name,
        collegeId: user.collegeId,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        emailVerified: user.emailVerified
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

    // Validate email domain if email is provided
    if (email && !email.toLowerCase().endsWith('@nitj.ac.in')) {
      return res.status(400).json({
        success: false,
        message: 'Only NITJ college email addresses (@nitj.ac.in) are allowed'
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

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your college email for the OTP.',
        requiresVerification: true,
        email: user.email
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

        // Validate email domain - must be @nitj.ac.in
        if (!googleUser.email.toLowerCase().endsWith('@nitj.ac.in')) {
            return res.status(403).json({
                success: false,
                message: 'Only NITJ college email addresses (@nitj.ac.in) are allowed. Please use your college email.'
            });
        }

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
                isActive: true,
                emailVerified: false // Require email verification even for Google OAuth
            });

            // Generate and send OTP
            const otp = user.generateEmailOTP();
            await user.save();

            // Send OTP email
            try {
                await sendEmail({
                    email: user.email,
                    subject: 'NITJ Hostel Management - Verify Your Email',
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                        <div style="background: white; padding: 30px; border-radius: 8px;">
                          <h2 style="color: #667eea; text-align: center; margin-bottom: 20px;">🏠 NITJ Hostel Management</h2>
                          <h3 style="color: #333; margin-bottom: 15px;">Welcome ${user.name}!</h3>
                          <p style="color: #666; font-size: 16px; line-height: 1.6;">Thank you for signing up with Google.</p>
                          <p style="color: #666; font-size: 16px; line-height: 1.6;">Please verify your college email address using the OTP below:</p>
                          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
                          </div>
                          <p style="color: #666; font-size: 14px; line-height: 1.6;"><strong>This OTP is valid for 10 minutes.</strong></p>
                          <p style="color: #666; font-size: 14px; line-height: 1.6;">After verification, you can access the hostel management system.</p>
                          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 NITJ Hostel Management System. All rights reserved.</p>
                        </div>
                      </div>
                    `
                });
            } catch (emailError) {
                console.error('Email sending error:', emailError);
            }

            return res.json({
                success: true,
                message: 'Account created! Please verify your email with the OTP sent to your college email.',
                requiresVerification: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    collegeId: user.collegeId,
                    role: user.role,
                    emailVerified: user.emailVerified
                }
            });
        } else if (!user.googleId) {
            // Link Google account to existing user
            user.googleId = googleUser.id;
            user.avatar = googleUser.picture;
            await user.save();
        }

        // Check if email is verified
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in. Check your college email for the OTP.',
                requiresVerification: true,
                email: user.email
            });
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


// @route   POST /api/auth/send-verification-otp
// @desc    Send OTP to verify college email (or resend)
// @access  Public
router.post('/send-verification-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email domain
    if (!email.toLowerCase().endsWith('@nitj.ac.in')) {
      return res.status(400).json({
        success: false,
        message: 'Only NITJ college email addresses (@nitj.ac.in) are allowed'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please register first.'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. You can login now.'
      });
    }

    // Generate OTP
    const otp = user.generateEmailOTP();
    await user.save();

    // Send OTP email
    try {
      await sendEmail({
        email: user.email,
        subject: 'NITJ Hostel Management - Email Verification OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #667eea; text-align: center; margin-bottom: 20px;">🏠 NITJ Hostel Management</h2>
              <h3 style="color: #333; margin-bottom: 15px;">Email Verification</h3>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello ${user.name},</p>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">Your OTP for email verification is:</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #666; font-size: 14px; line-height: 1.6;"><strong>This OTP is valid for 10 minutes.</strong></p>
              <p style="color: #666; font-size: 14px; line-height: 1.6;">Enter this OTP to verify your email and complete your registration.</p>
              <p style="color: #666; font-size: 14px; line-height: 1.6;">If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">© 2026 NITJ Hostel Management System. All rights reserved.</p>
            </div>
          </div>
        `
      });

      res.json({
        success: true,
        message: 'OTP sent to your college email. Please check your inbox.'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message
    });
  }
});

// @route   POST /api/auth/verify-email-otp
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Verify OTP
    if (!user.verifyEmailOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
});
