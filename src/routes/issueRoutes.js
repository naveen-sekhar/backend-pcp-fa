// Express router: GET/POST/PATCH/DELETE /issues, GET /issues/search
// RBAC: admin/manager can create/assign/change priority; developer can update assigned; tester can report
const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate, authorize } = require('../middleware/auth');

// All issue routes require authentication
router.use(authenticate);

// Search must come before /:id to avoid Express treating "search" as an id
router.get('/search', issueController.search);
router.get('/', issueController.getAll);
router.get('/:id', issueController.getById);

// Only admin/manager/tester can create issues
router.post('/', authorize('admin', 'manager', 'tester'), issueController.create);

// Workflow endpoints (assign, status)
router.patch('/:id/assign', authorize('admin', 'manager'), issueController.assignIssue);
router.patch('/:id/status', authorize('admin', 'manager', 'developer', 'tester'), issueController.updateStatus);

// All authenticated roles can PATCH (controller enforces workflow rules per role)
router.patch('/:id', authorize('admin', 'manager', 'developer', 'tester'), issueController.update);

// Only admin/manager can delete issues
router.delete('/:id', authorize('admin', 'manager'), issueController.remove);

module.exports = router;
