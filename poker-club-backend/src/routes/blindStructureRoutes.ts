import { Router } from 'express';
import { BlindStructureController } from '../controllers/BlindStructureController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Получить все структуры (доступно всем)
router.get('/', BlindStructureController.getAllStructures);

// Получить структуру по ID (доступно всем)
router.get('/:id', BlindStructureController.getStructureById);

// Создать структуру (только ADMIN)
router.post('/', BlindStructureController.createStructure);

// Добавить уровень к структуре (только ADMIN)
router.post('/:id/levels', BlindStructureController.addLevel);

// Деактивировать структуру (только ADMIN)
router.delete('/:id', BlindStructureController.deactivateStructure);

export default router;
