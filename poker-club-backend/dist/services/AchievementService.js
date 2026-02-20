"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementService = void 0;
const database_1 = require("../config/database");
const AchievementType_1 = require("../models/AchievementType");
const AchievementInstance_1 = require("../models/AchievementInstance");
const PlayerAchievementPin_1 = require("../models/PlayerAchievementPin");
const TournamentResult_1 = require("../models/TournamentResult");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const PlayerProfile_1 = require("../models/PlayerProfile");
const Tournament_1 = require("../models/Tournament");
const statistics_1 = require("./statistics");
class AchievementService {
    constructor() {
        this.achievementTypeRepo = database_1.AppDataSource.getRepository(AchievementType_1.AchievementType);
        this.achievementInstanceRepo = database_1.AppDataSource.getRepository(AchievementInstance_1.AchievementInstance);
        this.pinRepo = database_1.AppDataSource.getRepository(PlayerAchievementPin_1.PlayerAchievementPin);
        this.resultRepo = database_1.AppDataSource.getRepository(TournamentResult_1.TournamentResult);
        this.registrationRepo = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.profileRepo = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.tournamentRepo = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.pokerStats = statistics_1.PokerStatisticsService.getInstance();
    }
    /**
     * Инициализировать типы достижений
     */
    async seedAchievementTypes() {
        const types = [
            { code: AchievementType_1.AchievementCode.FIRST_TOURNAMENT, name: 'Первый турнир', description: 'Сыграйте свой первый турнир', icon: '🎯', conditionDescription: 'Сыграть 1 турнир', statisticType: AchievementType_1.AchievementStatisticType.TOURNAMENTS_PLAYED, targetValue: 1, sortOrder: 1 },
            { code: AchievementType_1.AchievementCode.FIVE_TOURNAMENTS, name: 'Ветеран', description: 'Сыграйте 5 турниров', icon: '📊', conditionDescription: 'Сыграть 5 турниров', statisticType: AchievementType_1.AchievementStatisticType.TOURNAMENTS_PLAYED, targetValue: 5, sortOrder: 2 },
            { code: AchievementType_1.AchievementCode.TEN_TOURNAMENTS, name: 'Постоялец', description: 'Сыграйте 10 турниров', icon: '🏠', conditionDescription: 'Сыграть 10 турниров', statisticType: AchievementType_1.AchievementStatisticType.TOURNAMENTS_PLAYED, targetValue: 10, sortOrder: 3 },
            { code: AchievementType_1.AchievementCode.FINAL_TABLE, name: 'Финальный стол', description: 'Попадите на финальный стол', icon: '🪑', conditionDescription: 'Попасть на финальный стол', statisticType: AchievementType_1.AchievementStatisticType.FINAL_TABLE, targetValue: 1, sortOrder: 4 },
            { code: AchievementType_1.AchievementCode.WIN, name: 'Победитель', description: 'Выиграйте турнир', icon: '🏆', conditionDescription: 'Выиграть 1 турнир', statisticType: AchievementType_1.AchievementStatisticType.WINS, targetValue: 1, sortOrder: 5 },
            { code: AchievementType_1.AchievementCode.HOT_STREAK, name: 'Горячая серия', description: 'Финишируйте в призах 3 раза подряд', icon: '🔥', conditionDescription: 'Финишировать в призах 3 раза подряд', statisticType: AchievementType_1.AchievementStatisticType.ITM_STREAK, targetValue: 3, sortOrder: 6 },
            { code: AchievementType_1.AchievementCode.SERIES_WINNER, name: 'Победитель серии', description: 'Выиграйте турнир из серии', icon: '⭐', conditionDescription: 'Выиграть турнир серии', statisticType: AchievementType_1.AchievementStatisticType.SERIES_WINS, targetValue: 1, sortOrder: 7 },
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
     * Получить достижения, выданные за турнир (по tournamentId)
     */
    async getAchievementsByTournamentId(tournamentId) {
        return this.achievementInstanceRepo.find({
            where: { tournamentId },
            relations: ['achievementType'],
            order: { unlockedAt: 'ASC' },
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
                const a = await this.grantAchievement(userId, AchievementType_1.AchievementCode.HOT_STREAK, tournamentId, { streak: 3 });
                if (a)
                    granted.push(a);
            }
        }
        // 7. SERIES_WINNER (1-е место в турнире серии)
        const tournament = await this.tournamentRepo.findOne({
            where: { id: tournamentId },
            relations: ['series'],
        });
        if (result.finishPosition === 1 && tournament?.series) {
            const a = await this.grantAchievement(userId, AchievementType_1.AchievementCode.SERIES_WINNER, tournamentId, { seriesWins: 1 });
            if (a)
                granted.push(a);
        }
        // 8. Настраиваемые достижения (statisticType + targetValue) — используем PokerStatisticsService
        const customTypes = await this.achievementTypeRepo.find({
            where: {},
            order: { sortOrder: 'ASC' },
        });
        const hasCustomTypes = customTypes.some((t) => t.statisticType && t.targetValue > 0);
        const statsResult = hasCustomTypes
            ? await this.pokerStats.getPlayerStatisticsByProfileId(profile.id, undefined, ['tournamentsPlayed', 'wins', 'seriesWins', 'finalTableCount'])
            : null;
        const metrics = statsResult?.metrics ?? {};
        for (const t of customTypes) {
            if (!t.statisticType || t.targetValue <= 0)
                continue;
            if (t.statisticType === AchievementType_1.AchievementStatisticType.CONSECUTIVE_POSITION && t.targetPosition == null)
                continue;
            const existing = await this.achievementInstanceRepo.findOne({
                where: { userId, achievementTypeId: t.id },
            });
            if (existing)
                continue;
            let value = 0;
            if (t.statisticType === AchievementType_1.AchievementStatisticType.TOURNAMENTS_PLAYED) {
                value = metrics.tournamentsPlayed ?? 0;
            }
            else if (t.statisticType === AchievementType_1.AchievementStatisticType.WINS) {
                value = metrics.wins ?? 0;
            }
            else if (t.statisticType === AchievementType_1.AchievementStatisticType.SERIES_WINS) {
                value = metrics.seriesWins ?? 0;
            }
            else if (t.statisticType === AchievementType_1.AchievementStatisticType.FINAL_TABLE) {
                value = metrics.finalTableCount ?? 0;
            }
            else if (t.statisticType === AchievementType_1.AchievementStatisticType.ITM_STREAK) {
                value = profile.bestStreak ?? 0;
            }
            else if (t.statisticType === AchievementType_1.AchievementStatisticType.CONSECUTIVE_WINS) {
                value = await this.getConsecutiveWins(profile.id);
            }
            else if (t.statisticType === AchievementType_1.AchievementStatisticType.CONSECUTIVE_POSITION) {
                const pos = t.targetPosition ?? 1;
                value = await this.getConsecutivePositionCount(profile.id, pos);
            }
            if (value >= t.targetValue) {
                const a = await this.grantAchievementByTypeId(userId, t.id, tournamentId, { value, target: t.targetValue });
                if (a)
                    granted.push(a);
            }
        }
        return granted;
    }
    async getConsecutiveWins(playerProfileId) {
        return this.getConsecutivePositionCount(playerProfileId, 1);
    }
    /**
     * Количество раз подряд с указанным местом.
     * @param targetPosition 1=1-е место, 2=2-е место, ..., 0=последнее место (вылетел первым)
     */
    async getConsecutivePositionCount(playerProfileId, targetPosition) {
        const results = await this.resultRepo.find({
            where: { player: { id: playerProfileId } },
            relations: ['tournament'],
            order: { id: 'DESC' },
            take: 50,
        });
        if (results.length === 0)
            return 0;
        const tournamentIds = [...new Set(results.map((r) => r.tournament?.id).filter(Boolean))];
        let totalByTid = {};
        if (targetPosition === 0 && tournamentIds.length > 0) {
            const rows = await this.registrationRepo
                .createQueryBuilder('r')
                .select('r.tournament_id', 'tid')
                .addSelect('COUNT(*)', 'cnt')
                .where('r.tournament_id IN (:...ids)', { ids: tournamentIds })
                .groupBy('r.tournament_id')
                .getRawMany();
            totalByTid = Object.fromEntries(rows.map((r) => [r.tid, parseInt(String(r.cnt), 10)]));
        }
        let streak = 0;
        for (const r of results) {
            const matches = targetPosition === 0
                ? r.tournament?.id && totalByTid[r.tournament.id]
                    ? r.finishPosition === totalByTid[r.tournament.id]
                    : false
                : r.finishPosition === targetPosition;
            if (matches)
                streak++;
            else
                break;
        }
        return streak;
    }
    /**
     * Выдать достижение по коду (если ещё не выдано)
     */
    async grantAchievement(userId, achievementCode, tournamentId, metadata) {
        const type = await this.achievementTypeRepo.findOne({ where: { code: achievementCode } });
        if (!type)
            return null;
        return this.grantAchievementByTypeId(userId, type.id, tournamentId, metadata);
    }
    /**
     * Выдать достижение по ID типа (если ещё не выдано)
     */
    async grantAchievementByTypeId(userId, achievementTypeId, tournamentId, metadata) {
        const existing = await this.achievementInstanceRepo.findOne({
            where: { userId, achievementTypeId },
        });
        if (existing)
            return null;
        const type = await this.achievementTypeRepo.findOne({ where: { id: achievementTypeId } });
        if (!type)
            return null;
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
     * Получить прогресс достижений пользователя + закреплённые (до 4)
     */
    async getUserAchievementProgress(userId) {
        const allTypes = await this.getAllAchievementTypes();
        const unlocked = await this.getUserAchievements(userId);
        const pins = await this.pinRepo.find({
            where: { userId },
            relations: ['achievementType'],
            order: { sortOrder: 'ASC' },
        });
        const unlockedTypeIds = unlocked.map((a) => a.achievementType.id);
        const locked = allTypes.filter((t) => !unlockedTypeIds.includes(t.id));
        return {
            unlocked,
            locked,
            pinnedTypeIds: pins.map((p) => p.achievementTypeId),
            total: allTypes.length,
            unlockedCount: unlocked.length,
        };
    }
    /**
     * Установить закреплённые достижения (до 4)
     */
    async setPinnedAchievements(userId, achievementTypeIds) {
        await this.pinRepo.delete({ userId });
        const toInsert = achievementTypeIds.slice(0, 4).map((id, i) => this.pinRepo.create({ userId, achievementTypeId: id, sortOrder: i }));
        if (toInsert.length > 0) {
            await this.pinRepo.save(toInsert);
        }
    }
    /**
     * Создать тип достижения (админ)
     * Для CONSECUTIVE_POSITION: targetPosition = 1..N (место), 0 = последнее место; targetValue = кол-во раз подряд
     */
    async createAchievementType(data) {
        const maxOrder = await this.achievementTypeRepo
            .createQueryBuilder('t')
            .select('MAX(t.sortOrder)', 'max')
            .getRawOne();
        const sortOrder = (maxOrder?.max ?? 0) + 1;
        const type = this.achievementTypeRepo.create({
            name: data.name,
            description: data.description,
            icon: data.icon ?? undefined,
            iconUrl: data.iconUrl ?? undefined,
            statisticType: data.statisticType ?? undefined,
            targetValue: data.targetValue ?? 0,
            targetPosition: data.targetPosition,
            conditionDescription: data.conditionDescription ?? data.description ?? undefined,
            sortOrder,
        });
        return this.achievementTypeRepo.save(type);
    }
    /**
     * Отозвать достижение у игрока (только админ)
     */
    async revokeAchievement(instanceId) {
        await this.achievementInstanceRepo.delete(instanceId);
    }
}
exports.AchievementService = AchievementService;
//# sourceMappingURL=AchievementService.js.map