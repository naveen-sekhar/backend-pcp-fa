// CRUD handlers for projects — messages match exam spec exactly
const Project = require('../models/Project');

// GET /projects — paginated
async function getAll(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.owner) filter.owner = req.query.owner;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Project.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const projects = await Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Projects fetched successfully',
      page,
      limit,
      total,
      totalPages,
      data: projects
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /projects/:id
async function getById(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Project fetched successfully',
      data: project
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// POST /projects
async function create(req, res) {
  try {
    const { projectId, title, status } = req.body;

    if (!projectId || !title || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId, title, status'
      });
    }

    const project = await Project.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate projectId' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

// PATCH /projects/:id
async function update(req, res) {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// DELETE /projects/:id — no data in response per spec
async function remove(req, res) {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getAll, getById, create, update, remove };
