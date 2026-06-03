// Mongoose schema/model for activity logs with relationships
const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true },

  // Relationship refs (ObjectId) — for populated lookups
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // String-based IDs (from synced dataset)
  issueId: { type: String, required: true },
  userId: { type: String, required: true },

  action: {
    type: String,
    required: true,
    enum: ['created', 'assigned', 'status_changed', 'resolved', 'closed']
  },
  previousStatus: { type: String, default: null },
  newStatus: { type: String, default: null },
  timestamp: { type: String, required: true }
}, { timestamps: true });

// Index for relationship queries
ActivityLogSchema.index({ issueId: 1 });
ActivityLogSchema.index({ userId: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
