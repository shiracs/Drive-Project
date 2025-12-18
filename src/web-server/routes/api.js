import express from 'express';
import UserController from '../controllers/UserController.js';

const router = express.Router();

router.post('/users', UserController.registerUser);
router.get('/users/:id', UserController.getUserById);
router.post('/tokens', UserController.generateToken);
export default router;