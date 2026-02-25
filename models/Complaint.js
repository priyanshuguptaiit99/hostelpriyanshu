const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  category: { 
    type: String, 
    required: true,
    enum: ['mess', 'hostel', 'electrical', 'plumbing', 'wifi', 'cleanliness', 'security', 'other'],
    lowercase: true
  },
  description: { 
    type: String, 
    required: true,
    minlength: [10, 'Description must be at least 10 characters']
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  remarks: String,
  resolutionNotes: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: Date,
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    remarks: String
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

// Generate unique ticket ID
complaintSchema.statics.generateTicketId = async function() {
  const count = await this.countDocuments();
  const timestamp = Date.now().toString().slice(-6);
  return `TKT${timestamp}${(count + 1).toString().padStart(4, '0')}`;
};

// Method to update status with history
complaintSchema.methods.updateStatus = function(newStatus, userId, remarks) {
  this.status = newStatus;
  this.updatedAt = new Date();
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    remarks: remarks
  });
  
  // If resolved, set resolved fields
  if (newStatus === 'resolved') {
    this.resolvedBy = userId;
    this.resolvedAt = new Date();
  }
  
  return this;
};

module.exports = mongoose.model('Complaint', complaintSchema);
