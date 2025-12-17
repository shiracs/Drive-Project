const express = require('express');
const router = express.Router();

const userController = require('../controllers/UserController');

router.post('/users', userController.registerUser);

module.exports = router;