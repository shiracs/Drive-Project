import express from 'express';
import UserController from '../controllers/UserController.js';
import ResourceController from '../controllers/ResourceController.js';
import PermissionsController from '../controllers/PermissionsController.js'; 

const router = express.Router();

// User Routes
router.post('/users', UserController.registerUser);
router.get('/users/:id', UserController.getUserById);
router.post('/tokens', UserController.generateToken);

// File Routes
router.get('/files', ResourceController.getUserResourcesInDir);         
router.post('/files', ResourceController.uploadResource);     
router.get('/files/:id', ResourceController.getResourceContent); 
router.patch('/files/:id', ResourceController.updateResource);
router.delete('/files/:id', ResourceController.deleteResource);
router.get('/search/:query', ResourceController.searchResourcesByQuery);

// Permissions Routes
router.get('/files/:id/permissions', PermissionsController.getResourcePermissions);
router.post('/files/:id/permissions', PermissionsController.grantPermission);
router.patch('/files/:id/permissions/:pId', PermissionsController.updatePermission);
router.delete('/files/:id/permissions/:pId', PermissionsController.deletePermission);

export default router; 