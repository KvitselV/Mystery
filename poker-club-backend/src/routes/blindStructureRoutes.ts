import { Router } from 'express';
import { BlindStructureController } from '../controllers/BlindStructureController';
import { authMiddleware, requireAdminOrController } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', BlindStructureController.getAllStructures);
router.get('/:id', BlindStructureController.getStructureById);

router.post('/', requireAdminOrController(), BlindStructureController.createStructure);
router.post('/:id/levels', requireAdminOrController(), BlindStructureController.addLevel);
router.post('/:id/levels/with-coefficient', requireAdminOrController(), BlindStructureController.addLevelWithCoefficient);
router.delete('/:id', requireAdminOrController(), BlindStructureController.deactivateStructure);

export default router;
