const express = require('express');
const router = express.Router();

const userController = require('../controllers/UserController');

router.post('/users', userController.registerUser);
router.get('/users/:id', userController.getUserById);

module.exports = router;