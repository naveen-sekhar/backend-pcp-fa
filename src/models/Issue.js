// Mongoose schema/model for issues/bugs with relationships
const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  issueId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: null },

  // Relationship refs (ObjectId) — for populated lookups
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  assignedToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reportedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // String-based IDs (from synced dataset)
  projectId: { type: String, required: true },
  assignedTo: { type: String, default: null },
  reportedBy: { type: String, default: null },

  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical']
  },
  severity: {
    type: String,
    required: true,
    enum: ['minor', 'major', 'critical']
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'in-progress', 'testing', 'resolved', 'closed']
  },
  dueDate: { type: Date, default: null }
}, { timestamps: true });

// Index for relationship queries
IssueSchema.index({ projectId: 1 });
IssueSchema.index({ assignedTo: 1 });
IssueSchema.index({ reportedBy: 1 });
IssueSchema.index({ status: 1 });

module.exports = mongoose.model('Issue', IssueSchema);
