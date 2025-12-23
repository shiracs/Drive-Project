import express from 'express';
import UserController from '../controllers/UserController.js';
import FileController from '../controllers/FileController.js';

const router = express.Router();

router.post('/users', UserController.registerUser);
router.get('/users/:id', UserController.getUserById);
router.post('/tokens', UserController.generateToken);

router.get('/files', FileController.getUserFiles);         
router.post('/files', FileController.uploadFile);     
    
router.get('/files/:id', FileController.getFileContent); 
router.patch('/files/:id', FileController.updateFile);
router.delete('/files/:id', FileController.deleteFile);

router.get('/search/:query', FileController.searchFilesByQuery);

export default router;