// Mongoose schema/model for comments with relationships
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  commentId: { type: String, required: true, unique: true },

  // Relationship refs (ObjectId) — for populated lookups
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // String-based IDs (from synced dataset)
  issueId: { type: String, required: true },
  userId: { type: String, required: true },

  message: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { timestamps: true });

// Index for relationship queries
CommentSchema.index({ issueId: 1 });
CommentSchema.index({ userId: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
