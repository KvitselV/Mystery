import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Публичные маршруты
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

// Защищённые маршруты
router.get('/me', authMiddleware, AuthController.getMe);
router.patch('/me', authMiddleware, AuthController.updateProfile);
router.post('/promote-me', authMiddleware, AuthController.promoteToAdmin);

router.get('/users', authMiddleware, requireAdmin(), AuthController.getUsers);
router.post('/assign-controller', authMiddleware, requireAdmin(), AuthController.assignControllerToClub);
router.post('/promote-controller', authMiddleware, requireAdmin(), AuthController.promoteToController);

export default router;
