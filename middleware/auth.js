const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to access this route. Please login.' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found. Please login again.' 
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'Your account has been deactivated. Please contact admin.' 
        });
      }

      // Check if student is approved
      if (req.user.role === 'student' && req.user.approvalStatus !== 'approved') {
        return res.status(401).json({ 
          success: false, 
          message: 'Your account is pending approval. Please wait for warden approval.' 
        });
      }

      // Check if warden is approved
      if (req.user.role === 'warden' && req.user.approvalStatus !== 'approved') {
        return res.status(401).json({ 
          success: false, 
          message: 'Your account is pending approval. Please wait for admin approval.' 
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token. Please login again.' 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error',
      error: error.message 
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};

// Check if user is accessing their own data
exports.checkOwnership = (req, res, next) => {
  const requestedUserId = req.params.studentId || req.params.userId || req.body.studentId;
  
  // Warden can access any data
  if (req.user.role === 'warden') {
    return next();
  }
  
  // Student can only access their own data
  if (req.user.role === 'student') {
    if (requestedUserId && requestedUserId !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to access this data' 
      });
    }
  }
  
  next();
};

// Validate student can only mark their own attendance
exports.validateAttendanceOwnership = (req, res, next) => {
  // If warden, allow any studentId
  if (req.user.role === 'warden') {
    return next();
  }
  
  // If student, ensure they're marking their own attendance
  if (req.user.role === 'student') {
    // If studentId is provided in body, it must match logged-in user
    if (req.body.studentId && req.body.studentId !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only mark your own attendance' 
      });
    }
    
    // Set studentId to logged-in user
    req.body.studentId = req.user._id.toString();
  }
  
  next();
};
