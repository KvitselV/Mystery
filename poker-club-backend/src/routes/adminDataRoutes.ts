import { Router } from 'express';
import { AdminDataController } from '../controllers/AdminDataController';
import { authMiddleware, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.use(requireAdmin());
router.get('/data', AdminDataController.getAllData);
router.patch('/entity/:table/:id', AdminDataController.updateEntity);
router.post('/recalculate-ratings', AdminDataController.recalculateRatings);

export default router;
