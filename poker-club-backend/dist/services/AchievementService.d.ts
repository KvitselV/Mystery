import { AchievementType } from '../models/AchievementType';
import { AchievementInstance } from '../models/AchievementInstance';
export declare class AchievementService {
    private achievementTypeRepo;
    private achievementInstanceRepo;
    private pinRepo;
    private resultRepo;
    private registrationRepo;
    private profileRepo;
    private tournamentRepo;
    private pokerStats;
    /**
     * Инициализировать типы достижений
     */
    seedAchievementTypes(): Promise<void>;
    /**
     * Получить все типы достижений
     */
    getAllAchievementTypes(): Promise<AchievementType[]>;
    /**
     * Получить достижения, выданные за турнир (по tournamentId)
     */
    getAchievementsByTournamentId(tournamentId: string): Promise<AchievementInstance[]>;
    /**
     * Получить достижения пользователя
     */
    getUserAchievements(userId: string): Promise<AchievementInstance[]>;
    /**
     * Проверить и выдать достижения после турнира
     */
    checkAndGrantAchievements(userId: string, tournamentId: string): Promise<AchievementInstance[]>;
    private getConsecutiveWins;
    /**
     * Количество раз подряд с указанным местом.
     * @param targetPosition 1=1-е место, 2=2-е место, ..., 0=последнее место (вылетел первым)
     */
    private getConsecutivePositionCount;
    /**
     * Выдать достижение по коду (если ещё не выдано)
     */
    private grantAchievement;
    /**
     * Выдать достижение по ID типа (если ещё не выдано)
     */
    grantAchievementByTypeId(userId: string, achievementTypeId: string, tournamentId: string, metadata: Record<string, unknown>): Promise<AchievementInstance | null>;
    /**
     * Получить прогресс достижений пользователя + закреплённые (до 4)
     */
    getUserAchievementProgress(userId: string): Promise<{
        unlocked: AchievementInstance[];
        locked: AchievementType[];
        pinnedTypeIds: string[];
        total: number;
        unlockedCount: number;
    }>;
    /**
     * Установить закреплённые достижения (до 4)
     */
    setPinnedAchievements(userId: string, achievementTypeIds: string[]): Promise<void>;
    /**
     * Создать тип достижения (админ)
     * Для CONSECUTIVE_POSITION: targetPosition = 1..N (место), 0 = последнее место; targetValue = кол-во раз подряд
     */
    createAchievementType(data: {
        name: string;
        description: string;
        icon?: string;
        iconUrl?: string;
        statisticType?: string;
        targetValue?: number;
        targetPosition?: number;
        conditionDescription?: string;
    }): Promise<AchievementType>;
    /**
     * Отозвать достижение у игрока (только админ)
     */
    revokeAchievement(instanceId: string): Promise<void>;
}
//# sourceMappingURL=AchievementService.d.ts.map