// CRUD handlers for issues with workflow rules — messages match exam spec
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const User = require('../models/User');

// GET /issues — paginated with filters and search
async function getAll(req, res) {
  try {
    const filter = {};
    const hasFilters = !!(req.query.status || req.query.priority || req.query.severity || req.query.projectId || req.query.assignedTo);

    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    // Search support: ?search=keyword
    if (req.query.search) {
      const regex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { issueId: regex },
        { title: regex },
        { description: regex },
        { projectId: regex },
        { assignedTo: regex },
        { reportedBy: regex }
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Issue.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const issues = await Issue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const message = hasFilters ? 'Issues filtered successfully' : 'Issues fetched successfully';

    return res.status(200).json({
      success: true,
      message,
      page,
      limit,
      total,
      totalPages,
      data: issues
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /issues/search?q=keyword
async function search(req, res) {
  try {
    const q = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let searchFilter = {};
    if (q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      searchFilter = {
        $or: [
          { issueId: regex },
          { title: regex },
          { description: regex },
          { projectId: regex },
          { assignedTo: regex },
          { reportedBy: regex },
          { priority: regex },
          { severity: regex },
          { status: regex }
        ]
      };
    }

    const total = await Issue.countDocuments(searchFilter);
    const totalPages = Math.ceil(total / limit);
    const issues = await Issue.find(searchFilter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Issues fetched successfully',
      page,
      limit,
      total,
      totalPages,
      data: issues
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /issues/:id
async function getById(req, res) {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Issue fetched successfully',
      data: issue
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// POST /issues — with workflow validation
async function create(req, res) {
  try {
    const { issueId, title, projectId, priority, severity, status } = req.body;

    if (!issueId || !title || !projectId || !priority || !severity || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: issueId, title, projectId, priority, severity, status'
      });
    }

    // WORKFLOW: Invalid project references must be rejected
    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(400).json({
        success: false,
        message: `Invalid project reference: project '${projectId}' not found`
      });
    }

    // WORKFLOW: Duplicate issue titles within same project not allowed
    const duplicateTitle = await Issue.findOne({ title: title.trim(), projectId });
    if (duplicateTitle) {
      return res.status(409).json({
        success: false,
        message: `Duplicate issue title '${title}' within project '${projectId}'`
      });
    }

    const issue = await Issue.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: issue
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate issueId' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

// PATCH /issues/:id — with workflow rules
async function update(req, res) {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const userRole = req.user?.role;
    const userUserId = req.user?.userId;

    // WORKFLOW: Resolved issues cannot be edited directly
    if (issue.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Resolved issues cannot be edited directly'
      });
    }

    // WORKFLOW: Closed issues cannot be reassigned
    if (issue.status === 'closed' && req.body.assignedTo && req.body.assignedTo !== issue.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Closed issues cannot be reassigned'
      });
    }

    // WORKFLOW: Only managers/admins can assign issues
    if (req.body.assignedTo && req.body.assignedTo !== issue.assignedTo) {
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only managers and admins can assign issues'
        });
      }
    }

    // WORKFLOW: Only managers/admins can change issue priority
    if (req.body.priority && req.body.priority !== issue.priority) {
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only managers and admins can change issue priority'
        });
      }
    }

    // WORKFLOW: Developers can update only assigned issues
    if (userRole === 'developer') {
      if (issue.assignedTo !== userUserId) {
        return res.status(403).json({
          success: false,
          message: 'Developers can only update issues assigned to them'
        });
      }
    }

    // WORKFLOW: Duplicate issue titles within same project not allowed
    if (req.body.title && req.body.title !== issue.title) {
      const projectId = req.body.projectId || issue.projectId;
      const duplicateTitle = await Issue.findOne({
        title: req.body.title.trim(),
        projectId,
        _id: { $ne: issue._id }
      });
      if (duplicateTitle) {
        return res.status(409).json({
          success: false,
          message: `Duplicate issue title '${req.body.title}' within project '${projectId}'`
        });
      }
    }

    // WORKFLOW: Invalid project references must be rejected
    if (req.body.projectId && req.body.projectId !== issue.projectId) {
      const project = await Project.findOne({ projectId: req.body.projectId });
      if (!project) {
        return res.status(400).json({
          success: false,
          message: `Invalid project reference: project '${req.body.projectId}' not found`
        });
      }
    }

    const updated = await Issue.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: 'Issue updated successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// DELETE /issues/:id — no data in response per spec
async function remove(req, res) {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// PATCH /issues/:id/assign
async function assignIssue(req, res) {
  try {
    const { assignedTo } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // WORKFLOW: Closed issues cannot be assigned
    if (issue.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Closed issues cannot be assigned'
      });
    }

    // WORKFLOW: Assigned user must exist
    const userExists = await User.findOne({ userId: assignedTo });
    if (!userExists) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must exist'
      });
    }

    await Issue.findByIdAndUpdate(req.params.id, { assignedTo }, {
      returnDocument: 'after',
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: 'Issue assigned successfully',
      data: {
        issueId: issue.issueId,
        assignedTo: {
          _id: userExists._id,
          name: userExists.name
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// PATCH /issues/:id/status
async function updateStatus(req, res) {
  try {
    const { status } = req.body;

    const validStatuses = ['open', 'in-progress', 'testing', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const userRole = req.user?.role;
    const userUserId = req.user?.userId;

    // WORKFLOW: Closed issues cannot move back without reopen
    if (issue.status === 'closed' && status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Closed issues cannot move back without reopen'
      });
    }

    // WORKFLOW: Resolved issues cannot be edited directly
    if (issue.status === 'resolved' && !['closed', 'open'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Resolved issues cannot be edited directly'
      });
    }

    // WORKFLOW: Testers cannot close issues directly
    if (userRole === 'tester' && status === 'closed') {
      return res.status(403).json({
        success: false,
        message: 'Testers cannot close issues directly'
      });
    }

    // WORKFLOW: Only assigned developer can move issue to testing
    if (status === 'testing') {
      if (userRole !== 'developer' || issue.assignedTo !== userUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only assigned developer can move issue to testing'
        });
      }
    }

    const updated = await Issue.findByIdAndUpdate(req.params.id, { status }, {
      returnDocument: 'after',
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: 'Issue status updated successfully',
      data: {
        issueId: updated.issueId,
        status: updated.status,
        updatedAt: updated.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getAll, getById, create, update, remove, search, assignIssue, updateStatus };
