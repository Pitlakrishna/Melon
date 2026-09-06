import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../utils/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);

export default router;
