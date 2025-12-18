import express from 'express';
import UserController from '../controllers/UserController.js';
import FileController from '../controllers/FileController.js';

const router = express.Router();

router.post('/users', UserController.registerUser);
router.get('/users/:id', UserController.getUserById);
router.post('/tokens', UserController.generateToken);

router.get('/files', FileController.getFiles);
router.post('/files', FileController.uploadFile);
export default router;