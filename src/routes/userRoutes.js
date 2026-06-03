// User routes: GET /users, GET /users/:id — requires auth
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', userController.getAll);
router.get('/:id', userController.getById);

module.exports = router;
