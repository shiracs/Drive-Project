import express from 'express';
import UserController from '../controllers/UserController.js';
import ResourceController from '../controllers/ResourceController.js';
import PermissionsController from '../controllers/PermissionsController.js'; 
import {isLoggedIn} from '../middleware/AuthMiddleware.js';

const router = express.Router();

// User Routes
router.post('/users', UserController.registerUser);
router.get('/users/:id', UserController.getUserById);
router.post('/tokens', UserController.generateToken);

// File Routes
router.get('/files', isLoggedIn, ResourceController.getUserResourcesInDir);         
router.post('/files', isLoggedIn, ResourceController.uploadResource);     
router.get('/files/:id', isLoggedIn, ResourceController.getResourceContent); 
router.patch('/files/:id', isLoggedIn, ResourceController.updateResource);
router.delete('/files/:id', isLoggedIn, ResourceController.deleteResource);
router.get('/shared', isLoggedIn, ResourceController.getSharedResources);
router.get('/search/:query', isLoggedIn, ResourceController.searchResourcesByQuery);

// Permissions Routes
router.get('/files/:id/permissions', isLoggedIn, PermissionsController.getResourcePermissions);
router.post('/files/:id/permissions', isLoggedIn, PermissionsController.grantPermission);
router.patch('/files/:id/permissions/:pId', isLoggedIn, PermissionsController.updatePermission);
router.delete('/files/:id/permissions/:pId', isLoggedIn, PermissionsController.deletePermission);

export default router; 