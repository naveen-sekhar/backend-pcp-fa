// CRUD handlers for users (getAll with pagination, getById)
const User = require('../models/User');

// GET /users — paginated list
async function getAll(req, res) {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status) filter.status = req.query.status;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      page,
      limit,
      total,
      totalPages,
      data: users
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /users/:id
async function getById(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getAll, getById };
