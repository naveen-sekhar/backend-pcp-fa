// Mongoose schema/model for projects with relationships
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  category: { type: String, default: null },

  // Relationship refs (ObjectId) — for populated lookups
  ownerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  memberRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // String-based IDs (from synced dataset)
  owner: { type: String, default: null },
  members: { type: [String], default: [] },

  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'archived']
  },
  startDate: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
