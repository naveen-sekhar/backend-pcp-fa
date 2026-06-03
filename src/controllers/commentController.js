// CRUD handlers for comments — messages match exam spec exactly
const Comment = require('../models/Comment');
const Issue = require('../models/Issue');

// GET /comments — paginated, optional ?issueId= filter
async function getAll(req, res) {
  try {
    const filter = {};
    if (req.query.issueId) filter.issueId = req.query.issueId;
    if (req.query.userId) filter.userId = req.query.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Comment.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const comments = await Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Comments fetched successfully',
      page,
      limit,
      total,
      totalPages,
      data: comments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /comments/:id
async function getById(req, res) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Comment fetched successfully',
      data: comment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// POST /comments — validate issue exists
async function create(req, res) {
  try {
    const { commentId, issueId, userId, message } = req.body;

    if (!commentId || !issueId || !userId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: commentId, issueId, userId, message'
      });
    }

    // Validate that the issue exists
    const issue = await Issue.findOne({ issueId });
    if (!issue) {
      return res.status(400).json({
        success: false,
        message: `Invalid issue reference: issue '${issueId}' not found`
      });
    }

    const comment = await Comment.create({
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate commentId' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

// DELETE /comments/:id — no data in response per spec
async function remove(req, res) {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getAll, getById, create, remove };
