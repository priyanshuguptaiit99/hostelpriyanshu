/**
 * Hostel Management System
 * 
 * @author Priyanshu
 * @version 2.2
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

dotenv.config();

const app = express();

// =======================
// MIDDLEWARE
// =======================

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || true
    : true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (IMPORTANT)
app.use(express.static(path.join(__dirname, 'public')));

// =======================
// SESSION (Google OAuth)
// =======================

app.use(session({
  secret: process.env.JWT_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

try {
  require('./config/passport')(passport);
  console.log('✅ Passport configured');
} catch (err) {
  console.log('⚠️ Passport config not found');
}

// =======================
// DATABASE
// =======================

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// =======================
// API ROUTES
// =======================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/attendance-approval', require('./routes/attendanceApproval'));
app.use('/api/mess-bill', require('./routes/messBill'));
app.use('/api/mess-rate', require('./routes/messRate'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/warden-requests', require('./routes/wardenRequests'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server running' });
});

// =======================
// SPA FALLBACK (FIXED)
// =======================

app.get('*', (req, res, next) => {
  // If requesting a file like .html, .css, .js
  if (req.path.includes('.')) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =======================
// ERROR HANDLER
// =======================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// =======================
// START SERVER
// =======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
