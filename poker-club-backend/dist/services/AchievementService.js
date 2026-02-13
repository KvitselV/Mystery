"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementService = void 0;
const database_1 = require("../config/database");
const AchievementType_1 = require("../models/AchievementType");
const AchievementInstance_1 = require("../models/AchievementInstance");
const TournamentResult_1 = require("../models/TournamentResult");
const PlayerProfile_1 = require("../models/PlayerProfile");
class AchievementService {
    constructor() {
        this.achievementTypeRepo = database_1.AppDataSource.getRepository(AchievementType_1.AchievementType);
        this.achievementInstanceRepo = database_1.AppDataSource.getRepository(AchievementInstance_1.AchievementInstance);
        this.resultRepo = database_1.AppDataSource.getRepository(TournamentResult_1.TournamentResult);
        this.profileRepo = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
    }
    /**
     * Инициализировать типы достижений
     */
    async seedAchievementTypes() {
        const types = [
            {
                code: AchievementType_1.AchievementCode.FIRST_TOURNAMENT,
                name: 'Первый турнир',
                description: 'Сыграйте свой первый турнир',
                iconUrl: '/achievements/first-tournament.png',
                sortOrder: 1,
            },
            {
                code: AchievementType_1.AchievementCode.FIVE_TOURNAMENTS,
                name: 'Ветеран',
                description: 'Сыграйте 5 турниров',
                iconUrl: '/achievements/five-tournaments.png',
                sortOrder: 2,
            },
            {
                code: AchievementType_1.AchievementCode.TEN_TOURNAMENTS,
                name: 'Постоялец',
                description: 'Сыграйте 10 турниров',
                iconUrl: '/achievements/ten-tournaments.png',
                sortOrder: 3,
            },
            {
                code: AchievementType_1.AchievementCode.FINAL_TABLE,
                name: 'Финальный стол',
                description: 'Попадите на финальный стол',
                iconUrl: '/achievements/final-table.png',
                sortOrder: 4,
            },
            {
                code: AchievementType_1.AchievementCode.WIN,
                name: 'Победитель',
                description: 'Выиграйте турнир',
                iconUrl: '/achievements/win.png',
                sortOrder: 5,
            },
            {
                code: AchievementType_1.AchievementCode.HOT_STREAK,
                name: 'Горячая серия',
                description: 'Финишируйте в призах 3 раза подряд',
                iconUrl: '/achievements/hot-streak.png',
                sortOrder: 6,
            },
        ];
        for (const typeData of types) {
            const existing = await this.achievementTypeRepo.findOne({
                where: { code: typeData.code },
            });
            if (!existing) {
                const type = this.achievementTypeRepo.create(typeData);
                await this.achievementTypeRepo.save(type);
            }
        }
    }
    /**
     * Получить все типы достижений
     */
    async getAllAchievementTypes() {
        return this.achievementTypeRepo.find({
            order: { sortOrder: 'ASC' },
        });
    }
    /**
     * Получить достижения пользователя
     */
    async getUserAchievements(userId) {
        return this.achievementInstanceRepo.find({
            where: { userId },
            relations: ['achievementType', 'tournament'],
            order: { unlockedAt: 'DESC' },
        });
    }
    /**
     * Проверить и выдать достижения после турнира
     */
    async checkAndGrantAchievements(userId, tournamentId) {
        const granted = [];
        // Получить профиль игрока
        const profile = await this.profileRepo.findOne({
            where: { user: { id: userId } },
            relations: ['user'],
        });
        if (!profile) {
            console.warn(`Profile not found for user ${userId}`);
            return granted;
        }
        // Получить результат по player_id
        const result = await this.resultRepo
            .createQueryBuilder('result')
            .where('result.player_id = :playerId', { playerId: profile.id })
            .andWhere('result.tournament_id = :tournamentId', { tournamentId })
            .getOne();
        if (!result) {
            console.warn(`Result not found for player ${profile.id} in tournament ${tournamentId}`);
            return granted;
        }
        // Получить все результаты игрока по player_id
        const allResults = await this.resultRepo
            .createQueryBuilder('result')
            .where('result.player_id = :playerId', { playerId: profile.id })
            .orderBy('result.id', 'ASC')
            .getMany();
        const tournamentCount = allResults.length;
        // 1. FIRST_TOURNAMENT
        if (tournamentCount === 1) {
            const achievement = await this.grantAchievement(userId, AchievementType_1.AchievementCode.FIRST_TOURNAMENT, tournamentId, { tournamentCount });
            if (achievement)
                granted.push(achievement);
        }
        // 2. FIVE_TOURNAMENTS
        if (tournamentCount === 5) {
            const achievement = await this.grantAchievement(userId, AchievementType_1.AchievementCode.FIVE_TOURNAMENTS, tournamentId, { tournamentCount });
            if (achievement)
                granted.push(achievement);
        }
        // 3. TEN_TOURNAMENTS
        if (tournamentCount === 10) {
            const achievement = await this.grantAchievement(userId, AchievementType_1.AchievementCode.TEN_TOURNAMENTS, tournamentId, { tournamentCount });
            if (achievement)
                granted.push(achievement);
        }
        // 4. FINAL_TABLE
        if (result.isFinalTable) {
            const achievement = await this.grantAchievement(userId, AchievementType_1.AchievementCode.FINAL_TABLE, tournamentId, { finishPosition: result.finishPosition });
            if (achievement)
                granted.push(achievement);
        }
        // 5. WIN
        if (result.finishPosition === 1) {
            const achievement = await this.grantAchievement(userId, AchievementType_1.AchievementCode.WIN, tournamentId, { finishPosition: 1 });
            if (achievement)
                granted.push(achievement);
        }
        // 6. HOT_STREAK (3+ финиша в призах подряд)
        const recentResults = allResults.slice(-3);
        if (recentResults.length >= 3) {
            const allInPrizes = recentResults.every((r) => r.isFinalTable);
            if (allInPrizes) {
                const achievement = await this.grantAchievement(userId, AchievementType_1.AchievementCode.HOT_STREAK, tournamentId, { streak: 3 });
                if (achievement)
                    granted.push(achievement);
            }
        }
        return granted;
    }
    /**
     * Выдать достижение (если ещё не выдано)
     */
    async grantAchievement(userId, achievementCode, tournamentId, metadata) {
        // Проверить, не выдано ли уже
        const existing = await this.achievementInstanceRepo
            .createQueryBuilder('instance')
            .leftJoinAndSelect('instance.achievementType', 'type')
            .where('instance.userId = :userId', { userId })
            .andWhere('type.code = :code', { code: achievementCode })
            .getOne();
        if (existing) {
            return null; // Уже выдано
        }
        // Найти тип достижения
        const type = await this.achievementTypeRepo.findOne({
            where: { code: achievementCode },
        });
        if (!type) {
            console.error(`Achievement type not found: ${achievementCode}`);
            return null;
        }
        // Создать экземпляр достижения (metadata в БД хранится как JSON-строка)
        const instance = this.achievementInstanceRepo.create({
            userId,
            achievementType: type,
            tournamentId,
            metadata: JSON.stringify(metadata),
            unlockedAt: new Date(),
        });
        return this.achievementInstanceRepo.save(instance);
    }
    /**
     * Получить прогресс достижений пользователя
     */
    async getUserAchievementProgress(userId) {
        const allTypes = await this.getAllAchievementTypes();
        const unlocked = await this.getUserAchievements(userId);
        const unlockedTypeIds = unlocked.map((a) => a.achievementType.id);
        const locked = allTypes.filter((t) => !unlockedTypeIds.includes(t.id));
        return {
            unlocked,
            locked,
            total: allTypes.length,
            unlockedCount: unlocked.length,
        };
    }
}
exports.AchievementService = AchievementService;
//# sourceMappingURL=AchievementService.js.map