import { AchievementType } from '../models/AchievementType';
import { AchievementInstance } from '../models/AchievementInstance';
export declare class AchievementService {
    private achievementTypeRepo;
    private achievementInstanceRepo;
    private resultRepo;
    private profileRepo;
    /**
     * Инициализировать типы достижений
     */
    seedAchievementTypes(): Promise<void>;
    /**
     * Получить все типы достижений
     */
    getAllAchievementTypes(): Promise<AchievementType[]>;
    /**
     * Получить достижения пользователя
     */
    getUserAchievements(userId: string): Promise<AchievementInstance[]>;
    /**
     * Проверить и выдать достижения после турнира
     */
    checkAndGrantAchievements(userId: string, tournamentId: string): Promise<AchievementInstance[]>;
    /**
     * Выдать достижение (если ещё не выдано)
     */
    private grantAchievement;
    /**
     * Получить прогресс достижений пользователя
     */
    getUserAchievementProgress(userId: string): Promise<{
        unlocked: AchievementInstance[];
        locked: AchievementType[];
        total: number;
        unlockedCount: number;
    }>;
}
//# sourceMappingURL=AchievementService.d.ts.map