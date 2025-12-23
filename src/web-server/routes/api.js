import express from 'express';
import UserController from '../controllers/UserController.js';
import FileController from '../controllers/FileController.js';
import PermissionsController from '../controllers/PermissionsController.js'; // New import

const router = express.Router();

// User Routes
router.post('/users', UserController.registerUser);
router.get('/users/:id', UserController.getUserById);
router.post('/tokens', UserController.generateToken);

// File Routes
router.get('/files', FileController.getUserFiles);         
router.post('/files', FileController.uploadFile);     
router.get('/files/:id', FileController.getFileContent); 
router.patch('/files/:id', FileController.updateFile);
router.delete('/files/:id', FileController.deleteFile);

// Permissions Routes
router.get('/files/:id/permissions', PermissionsController.getFilePermissions);
router.post('/files/:id/permissions', PermissionsController.grantPermission);
router.patch('/files/:id/permissions/:pId', PermissionsController.updatePermission);
router.delete('/files/:id/permissions/:pId', PermissionsController.deletePermission);

export default router;