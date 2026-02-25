const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: false,
    index: true
  },
  date: { 
    type: Date, 
    required: true,
    index: true
  },
  markedAt: { 
    type: Date, 
    default: Date.now 
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave'],
    default: 'present'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: String,
  isEdited: {
    type: Boolean,
    default: false
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  editedAt: Date
}, {
  timestamps: true
});

// Compound index to ensure one attendance per student per day
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ hostelId: 1, approvalStatus: 1 });
attendanceSchema.index({ approvalStatus: 1, date: 1 });

// Method to get date without time for comparison
attendanceSchema.statics.getDateOnly = function(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Pre-save hook to normalize date (remove time component)
attendanceSchema.pre('save', function(next) {
  if (this.isModified('date')) {
    this.date = this.constructor.getDateOnly(this.date);
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
