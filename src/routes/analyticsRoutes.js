// Analytics routes: GET /analytics/issues, /analytics/projects, /analytics/developers
const express = require('express');
const router = express.Router();
const { issueAnalytics, projectAnalytics, developerAnalytics } = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin', 'manager'));

router.get('/issues', issueAnalytics);
router.get('/projects', projectAnalytics);
router.get('/developers', developerAnalytics);

module.exports = router;
