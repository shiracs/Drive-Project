const express = require('express');
const router = express.Router();

const userController = require('../controllers/UserController');

router.post('/users', userController.registerUser);
router.get('/users/:id', userController.getUserById);
router.post('/tokens', userController.generateToken);

module.exports = router;