import express from 'express';
import UserController from '../controllers/UserController.js';
import ResourceController from '../controllers/ResourceController.js';
import PermissionsController from '../controllers/PermissionsController.js'; 
import {isLoggedIn} from '../middleware/AuthMiddleware.js';

const router = express.Router();

// User Routes
router.post('/users', UserController.registerUser);
router.get('/users/:id', UserController.getUserById);
router.get('/users/username/:username', UserController.getUserByUsername);
router.post('/tokens', UserController.generateToken);

router.patch('/files/star/:id', isLoggedIn, ResourceController.toggleStarred);
router.post('/files/restore/:id', isLoggedIn, ResourceController.restoreResource);
router.delete('/files/permanent-delete/:id', isLoggedIn, ResourceController.deleteResource);
router.patch('/files/spam/:id', isLoggedIn, ResourceController.toggleSpam);

// File Routes
router.get('/files', isLoggedIn, ResourceController.getUserResourcesInDir);         
router.post('/files', isLoggedIn, ResourceController.uploadResource);     
router.get('/files/:id', isLoggedIn, ResourceController.getResourceContent); 
router.patch('/files/:id', isLoggedIn, ResourceController.updateResource);
router.delete('/files/:id', isLoggedIn, ResourceController.softDeleteResource);

router.get('/shared', isLoggedIn, ResourceController.getSharedResources);
router.get('/owned', isLoggedIn, ResourceController.getOwnedResources);
router.get('/recent', isLoggedIn, ResourceController.getRecentResources);
router.get('/starred', isLoggedIn, ResourceController.getStarredResources);
router.get('/trash', isLoggedIn, ResourceController.getTrashResources);
router.get('/spam', isLoggedIn, ResourceController.getSpamResources);

router.get('/search/:query', isLoggedIn, ResourceController.searchResourcesByQuery);

// Permissions Routes
router.get('/files/:id/permissions', isLoggedIn, PermissionsController.getResourcePermissions);
router.post('/files/:id/permissions', isLoggedIn, PermissionsController.grantPermission);
router.patch('/files/:id/permissions/:pId', isLoggedIn, PermissionsController.updatePermission);
router.delete('/files/:id/permissions/:pId', isLoggedIn, PermissionsController.deletePermission);

export default router; 