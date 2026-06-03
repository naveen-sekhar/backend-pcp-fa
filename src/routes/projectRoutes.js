// Project routes: CRUD with RBAC — admin/manager can create/update/delete
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);

// Only admin/manager can create, update, delete projects
router.post('/', authorize('admin', 'manager'), projectController.create);
router.patch('/:id', authorize('admin', 'manager'), projectController.update);
router.delete('/:id', authorize('admin', 'manager'), projectController.remove);

module.exports = router;
