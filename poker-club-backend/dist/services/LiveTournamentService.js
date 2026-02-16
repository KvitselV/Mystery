"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveTournamentService = void 0;
const database_1 = require("../config/database");
const Tournament_1 = require("../models/Tournament");
const PlayerProfile_1 = require("../models/PlayerProfile");
const PlayerOperation_1 = require("../models/PlayerOperation");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const TournamentResult_1 = require("../models/TournamentResult");
const BlindStructure_1 = require("../models/BlindStructure");
const TournamentLevel_1 = require("../models/TournamentLevel");
const SeatingService_1 = require("./SeatingService");
const MMRService_1 = require("./MMRService");
const LeaderboardService_1 = require("./LeaderboardService");
const LiveStateService_1 = require("./LiveStateService");
const AchievementService_1 = require("./AchievementService");
const StatisticsService_1 = require("./StatisticsService");
class LiveTournamentService {
    constructor() {
        this.tournamentRepository = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.playerRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.operationRepository = database_1.AppDataSource.getRepository(PlayerOperation_1.PlayerOperation);
        this.registrationRepository = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.resultRepository = database_1.AppDataSource.getRepository(TournamentResult_1.TournamentResult);
        this.blindStructureRepository = database_1.AppDataSource.getRepository(BlindStructure_1.BlindStructure);
        this.levelRepository = database_1.AppDataSource.getRepository(TournamentLevel_1.TournamentLevel);
        this.liveStateService = new LiveStateService_1.LiveStateService();
        this.seatingService = new SeatingService_1.SeatingService();
        this.mmrService = new MMRService_1.MMRService();
        this.leaderboardService = new LeaderboardService_1.LeaderboardService();
        this.achievementService = new AchievementService_1.AchievementService();
        this.statisticsService = new StatisticsService_1.StatisticsService();
    }
    async rebuy(tournamentId, playerProfileId, amount) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        // Проверка статуса турнира (ребаи доступны только в LATE_REG или RUNNING)
        if (tournament.status !== 'LATE_REG' && tournament.status !== 'RUNNING') {
            throw new Error('Rebuys are not available for this tournament status');
        }
        const player = await this.playerRepository.findOne({
            where: { id: playerProfileId },
            relations: ['balance'],
        });
        if (!player) {
            throw new Error('Player not found');
        }
        const rebuyAmount = amount ?? (tournament.rebuyCost ?? tournament.buyInCost);
        const rebuyChips = tournament.rebuyChips ?? 0;
        const registration = await this.registrationRepository.findOne({
            where: {
                tournament: { id: tournamentId },
                player: { id: playerProfileId },
            },
        });
        if (!registration) {
            throw new Error('Player is not registered for this tournament');
        }
        // Ребай добавляется в турнирный баланс, оплата при выходе
        const operation = this.operationRepository.create({
            playerProfile: player,
            operationType: 'REBUY',
            amount: rebuyAmount,
            tournament,
        });
        const savedOp = await this.operationRepository.save(operation);
        registration.currentStack += rebuyChips;
        await this.registrationRepository.save(registration);
        await this.liveStateService.recalculateStats(tournamentId);
        return savedOp;
    }
    /**
     * Аддон - игрок докупает дополнительные фишки
     */
    async addon(tournamentId, playerProfileId, amount) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        // Аддоны обычно доступны на определенных уровнях или перед финальным столом
        if (tournament.status !== 'RUNNING') {
            throw new Error('Addons are not available for this tournament status');
        }
        const player = await this.playerRepository.findOne({
            where: { id: playerProfileId },
            relations: ['balance'],
        });
        if (!player) {
            throw new Error('Player not found');
        }
        const addonChips = tournament.addonChips ?? 0;
        const registration = await this.registrationRepository.findOne({
            where: {
                tournament: { id: tournamentId },
                player: { id: playerProfileId },
            },
        });
        if (!registration) {
            throw new Error('Player is not registered for this tournament');
        }
        // Аддон добавляется в турнирный баланс, оплата при выходе
        const operation = this.operationRepository.create({
            playerProfile: player,
            operationType: 'ADDON',
            amount,
            tournament,
        });
        const savedOp = await this.operationRepository.save(operation);
        registration.currentStack += addonChips;
        await this.registrationRepository.save(registration);
        await this.liveStateService.recalculateStats(tournamentId);
        return savedOp;
    }
    /**
     * Выбытие игрока с записью результата.
     * finishPosition — место вылета. Если не указано, считается автоматически
     * (следующее место после уже вылетевших).
     */
    async eliminatePlayer(tournamentId, playerProfileId, finishPosition) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        const player = await this.playerRepository.findOne({
            where: { id: playerProfileId },
            relations: ['balance', 'user'],
        });
        if (!player) {
            throw new Error('Player not found');
        }
        let pos = finishPosition;
        if (pos == null || pos < 1) {
            const count = await this.resultRepository.count({ where: { tournament: { id: tournamentId } } });
            pos = count + 1;
        }
        await this.seatingService.eliminatePlayer(playerProfileId, pos);
        await this.liveStateService.recalculateStats(tournamentId);
        const result = this.resultRepository.create({
            tournament,
            player,
            finishPosition: pos,
            isFinalTable: pos <= 9,
        });
        const savedResult = await this.resultRepository.save(result);
        try {
            if (player.user?.id) {
                console.log(`📊 Updating statistics for player ${player.user.id}...`);
                await this.statisticsService.updatePlayerStatistics(player.user.id, tournamentId);
                console.log(`🏆 Checking achievements for player ${player.user.id}...`);
                const grantedAchievements = await this.achievementService.checkAndGrantAchievements(player.user.id, tournamentId);
                if (grantedAchievements.length > 0) {
                    console.log(`🎉 Player ${player.user.id} earned ${grantedAchievements.length} achievement(s):`, grantedAchievements.map((a) => a.achievementType?.code || 'unknown'));
                }
            }
        }
        catch (error) {
            console.error('❌ Error updating statistics/achievements:', error);
            // Не прерываем выполнение, просто логируем ошибку
        }
        return savedResult;
    }
    async moveToNextLevel(tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        if (!tournament.blindStructureId) {
            throw new Error('Tournament has no blind structure assigned');
        }
        const nextLevelNumber = tournament.currentLevelNumber + 1;
        // Получить следующий уровень
        const blindStructureService = database_1.AppDataSource.getRepository(BlindStructure_1.BlindStructure);
        const structure = await blindStructureService.findOne({
            where: { id: tournament.blindStructureId },
            relations: ['levels'],
        });
        if (!structure) {
            throw new Error('Blind structure not found');
        }
        const nextLevel = structure.levels.find((level) => level.levelNumber === nextLevelNumber);
        if (!nextLevel) {
            throw new Error('No more levels available');
        }
        // Обновить текущий уровень
        tournament.currentLevelNumber = nextLevelNumber;
        await this.tournamentRepository.save(tournament);
        return {
            tournament,
            currentLevel: nextLevel,
        };
    }
    async moveToPrevLevel(tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        if (!tournament.blindStructureId) {
            throw new Error('Tournament has no blind structure assigned');
        }
        const prevLevelNumber = tournament.currentLevelNumber - 1;
        if (prevLevelNumber < 1) {
            throw new Error('Already at first level');
        }
        const blindStructureService = database_1.AppDataSource.getRepository(BlindStructure_1.BlindStructure);
        const structure = await blindStructureService.findOne({
            where: { id: tournament.blindStructureId },
            relations: ['levels'],
        });
        if (!structure) {
            throw new Error('Blind structure not found');
        }
        const prevLevel = structure.levels.find((level) => level.levelNumber === prevLevelNumber);
        if (!prevLevel) {
            throw new Error('Previous level not found');
        }
        tournament.currentLevelNumber = prevLevelNumber;
        await this.tournamentRepository.save(tournament);
        return {
            tournament,
            currentLevel: prevLevel,
        };
    }
    async getCurrentLevel(tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament || !tournament.blindStructureId) {
            return null;
        }
        const structure = await this.blindStructureRepository.findOne({
            where: { id: tournament.blindStructureId },
            relations: ['levels'],
        });
        if (!structure) {
            return null;
        }
        return (structure.levels.find((level) => level.levelNumber === tournament.currentLevelNumber) || null);
    }
    async getNextLevel(tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament || !tournament.blindStructureId)
            return null;
        const structure = await this.blindStructureRepository.findOne({
            where: { id: tournament.blindStructureId },
            relations: ['levels'],
        });
        if (!structure)
            return null;
        return (structure.levels.find((level) => level.levelNumber === tournament.currentLevelNumber + 1) || null);
    }
    /**
     * Получить все операции игрока в турнире
     */
    async getPlayerOperationsInTournament(playerProfileId) {
        return this.operationRepository.find({
            where: { playerProfile: { id: playerProfileId } },
            order: { createdAt: 'DESC' },
        });
    }
    /**
     * Завершить турнир и обновить все рейтинги
     */
    async finishTournament(tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        // Проверка что турнир в статусе RUNNING или LATE_REG
        if (tournament.status !== 'RUNNING' && tournament.status !== 'LATE_REG') {
            throw new Error('Tournament is not running');
        }
        // 1. Изменить статус турнира на FINISHED
        tournament.status = 'FINISHED';
        await this.tournamentRepository.save(tournament);
        console.log(`🏁 Tournament ${tournamentId} finished`);
        // 2. Удалить live state
        await this.liveStateService.deleteLiveState(tournamentId);
        // 3. Обновить MMR и лидерборды
        await this.mmrService.recalculateTournamentMMR(tournamentId);
        await this.leaderboardService.updateLeaderboardsAfterTournament(tournamentId);
        try {
            console.log(`📊 Updating statistics and achievements for all players...`);
            // Получить все результаты турнира
            const results = await this.resultRepository
                .createQueryBuilder('result')
                .leftJoinAndSelect('result.player', 'player')
                .leftJoinAndSelect('player.user', 'user')
                .where('result.tournamentId = :tournamentId', { tournamentId })
                .getMany();
            console.log(`Found ${results.length} results to process`);
            // Обработать каждого игрока
            for (const result of results) {
                try {
                    const userId = result.player?.user?.id;
                    if (!userId) {
                        console.warn(`⚠️ Skipping result ${result.id}: no user ID found`);
                        continue;
                    }
                    // Обновить статистику
                    await this.statisticsService.updatePlayerStatistics(userId, tournamentId);
                    // Проверить достижения
                    const grantedAchievements = await this.achievementService.checkAndGrantAchievements(userId, tournamentId);
                    if (grantedAchievements.length > 0) {
                        console.log(`🏆 Player ${userId} earned ${grantedAchievements.length} achievement(s):`, grantedAchievements.map((a) => a.achievementType?.code || 'unknown'));
                    }
                }
                catch (error) {
                    console.error(`❌ Error processing player ${result.player?.id}:`, error);
                }
            }
            console.log('✅ All statistics and achievements updated');
        }
        catch (error) {
            console.error('❌ Error in statistics/achievements update:', error);
        }
        console.log(`✅ Tournament ${tournamentId} completed: MMR and leaderboards updated`);
    }
}
exports.LiveTournamentService = LiveTournamentService;
//# sourceMappingURL=LiveTournamentService.js.map