import { Router } from 'express';
import { StatisticsController } from '../controllers/StatisticsController';

const router = Router();

// Получить полную статистику пользователя
router.get('/user/:userId', StatisticsController.getFullStatistics);

// Статистика финишей
router.get('/user/:userId/finishes', StatisticsController.getFinishStatistics);

// График участия
router.get(
  '/user/:userId/participation',
  StatisticsController.getParticipationChart
);

// Последний турнир
router.get(
  '/user/:userId/last-tournament',
  StatisticsController.getLastTournament
);

// Обновить статистику вручную (admin)
router.post('/user/:userId/update', StatisticsController.updateStatistics);

export default router;
