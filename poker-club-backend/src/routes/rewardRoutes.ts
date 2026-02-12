import { Router } from 'express';
import { RewardController } from '../controllers/RewardController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/', RewardController.getRewards);
router.get('/:id', RewardController.getById);
router.post('/', RewardController.create);
router.patch('/:id', RewardController.update);
router.delete('/:id', RewardController.delete);

export default router;
