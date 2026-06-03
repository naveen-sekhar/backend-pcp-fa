// Comment routes: POST, GET, GET/:id, DELETE — auth required
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', commentController.getAll);
router.get('/:id', commentController.getById);
router.post('/', commentController.create);
router.delete('/:id', authorize('admin', 'manager'), commentController.remove);

module.exports = router;
