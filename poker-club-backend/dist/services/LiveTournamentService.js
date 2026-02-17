"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveTournamentService = void 0;
const database_1 = require("../config/database");
const Tournament_1 = require("../models/Tournament");
const PlayerProfile_1 = require("../models/PlayerProfile");
const PlayerOperation_1 = require("../models/PlayerOperation");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const TournamentResult_1 = require("../models/TournamentResult");
const TournamentPayment_1 = require("../models/TournamentPayment");
const TournamentAdminReport_1 = require("../models/TournamentAdminReport");
const BlindStructure_1 = require("../models/BlindStructure");
const TournamentLevel_1 = require("../models/TournamentLevel");
const SeatingService_1 = require("./SeatingService");
const MMRService_1 = require("./MMRService");
const LeaderboardService_1 = require("./LeaderboardService");
const LiveStateService_1 = require("./LiveStateService");
const AchievementService_1 = require("./AchievementService");
const StatisticsService_1 = require("./StatisticsService");
const queues_1 = require("../config/queues");
class LiveTournamentService {
    constructor() {
        this.tournamentRepository = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.playerRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.operationRepository = database_1.AppDataSource.getRepository(PlayerOperation_1.PlayerOperation);
        this.registrationRepository = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.resultRepository = database_1.AppDataSource.getRepository(TournamentResult_1.TournamentResult);
        this.paymentRepository = database_1.AppDataSource.getRepository(TournamentPayment_1.TournamentPayment);
        this.adminReportRepository = database_1.AppDataSource.getRepository(TournamentAdminReport_1.TournamentAdminReport);
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
        // Ребаи доступны только во время поздней регистрации (LATE_REG), не после её окончания (RUNNING)
        if (tournament.status !== 'LATE_REG') {
            throw new Error('Ребаи доступны только во время поздней регистрации');
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
        const maxRebuys = tournament.maxRebuys ?? 0;
        if (maxRebuys > 0) {
            const usedRebuys = await this.operationRepository.count({
                where: {
                    playerProfile: { id: playerProfileId },
                    tournament: { id: tournamentId },
                    operationType: 'REBUY',
                },
            });
            if (usedRebuys >= maxRebuys) {
                throw new Error(`Player has reached the maximum of ${maxRebuys} rebuys`);
            }
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
        // Аддоны доступны только во время аддонного перерыва
        const currentLevel = await this.getCurrentLevel(tournamentId);
        const isAddonBreak = currentLevel?.isBreak &&
            (currentLevel.breakType === 'ADDON' || currentLevel.breakType === 'END_LATE_REG_AND_ADDON');
        if (!isAddonBreak) {
            throw new Error('Аддоны доступны только во время аддонного перерыва');
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
        const maxAddons = tournament.maxAddons ?? 0;
        if (maxAddons > 0) {
            const usedAddons = await this.operationRepository.count({
                where: {
                    playerProfile: { id: playerProfileId },
                    tournament: { id: tournamentId },
                    operationType: 'ADDON',
                },
            });
            if (usedAddons >= maxAddons) {
                throw new Error(`Player has reached the maximum of ${maxAddons} addons`);
            }
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
        await this.seatingService.eliminatePlayer(playerProfileId, pos, tournamentId);
        const registration = await this.registrationRepository.findOne({
            where: { tournament: { id: tournamentId }, player: { id: playerProfileId } },
        });
        if (registration) {
            registration.isActive = false;
            registration.currentStack = 0; // Вылетел — фишки кончились (перешли победителю)
            await this.registrationRepository.save(registration);
        }
        await this.liveStateService.recalculateStats(tournamentId);
        let savedResult;
        const existingResult = await this.resultRepository.findOne({
            where: {
                tournament: { id: tournamentId },
                player: { id: playerProfileId },
            },
        });
        if (existingResult) {
            existingResult.finishPosition = pos;
            existingResult.isFinalTable = pos <= 9;
            savedResult = await this.resultRepository.save(existingResult);
        }
        else {
            const result = this.resultRepository.create({
                tournament,
                player,
                finishPosition: pos,
                isFinalTable: pos <= 9,
            });
            savedResult = await this.resultRepository.save(result);
        }
        if (player.user?.id) {
            await queues_1.tournamentQueue.add('update-stats', { type: 'UPDATE_STATS', userId: player.user.id, tournamentId });
            await queues_1.tournamentQueue.add('check-achievements', { type: 'CHECK_ACHIEVEMENTS', userId: player.user.id, tournamentId });
        }
        return savedResult;
    }
    /**
     * Вернуть вылетевшего игрока: ребай + реактивация + посадка на стол.
     * Доступно только во время поздней регистрации и при наличии неиспользованного ребая.
     */
    async returnEliminatedPlayer(tournamentId, playerProfileId, tableId, seatNumber) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament)
            throw new Error('Tournament not found');
        if (tournament.status !== 'LATE_REG') {
            throw new Error('Возврат возможен только во время поздней регистрации');
        }
        const registration = await this.registrationRepository.findOne({
            where: {
                tournament: { id: tournamentId },
                player: { id: playerProfileId },
            },
        });
        if (!registration)
            throw new Error('Игрок не зарегистрирован');
        if (registration.isActive)
            throw new Error('Игрок уже в турнире');
        const maxRebuys = tournament.maxRebuys ?? 0;
        const usedRebuys = await this.operationRepository.count({
            where: {
                playerProfile: { id: playerProfileId },
                tournament: { id: tournamentId },
                operationType: 'REBUY',
            },
        });
        if (maxRebuys > 0 && usedRebuys >= maxRebuys) {
            throw new Error(`Игрок использовал все ребаи (макс. ${maxRebuys})`);
        }
        const existingResult = await this.resultRepository.findOne({
            where: {
                tournament: { id: tournamentId },
                player: { id: playerProfileId },
            },
        });
        if (existingResult) {
            const oldPosition = existingResult.finishPosition; // 15 — последнее место
            await this.resultRepository.remove(existingResult);
            // Сдвиг: игроки с лучшими местами (14, 13, 12) становятся хуже на 1: 14→15, 13→14, 12→13
            const toShift = await this.resultRepository.find({
                where: { tournament: { id: tournamentId } },
                order: { finishPosition: 'DESC' },
            });
            for (const r of toShift) {
                if (r.finishPosition < oldPosition) {
                    r.finishPosition += 1;
                    await this.resultRepository.save(r);
                }
            }
        }
        registration.isActive = true;
        await this.registrationRepository.save(registration);
        await this.rebuy(tournamentId, playerProfileId);
        await this.seatingService.manualReseating(tournamentId, playerProfileId, tableId, seatNumber);
        await this.liveStateService.recalculateStats(tournamentId);
        return { message: 'Игрок возвращён в турнир' };
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
        // При выходе из перерыва с "конец поздней регистрации" — сменить статус на RUNNING
        const currentLevel = structure.levels.find((l) => l.levelNumber === tournament.currentLevelNumber);
        if (currentLevel?.isBreak && (currentLevel.breakType === 'END_LATE_REG' || currentLevel.breakType === 'END_LATE_REG_AND_ADDON')) {
            if (tournament.status === 'LATE_REG') {
                tournament.status = 'RUNNING';
            }
        }
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
        // 1. Изменить статус турнира на ARCHIVED
        tournament.status = 'ARCHIVED';
        await this.tournamentRepository.save(tournament);
        // 2. Создать отчёт для администратора (данные можно редактировать позже)
        const arrivedCount = await this.registrationRepository.count({
            where: { tournament: { id: tournamentId }, isArrived: true },
        });
        const payments = await this.paymentRepository.find({
            where: { tournamentId },
        });
        const cashRevenue = payments.reduce((s, p) => s + p.cashAmount, 0);
        const nonCashRevenue = payments.reduce((s, p) => s + p.nonCashAmount, 0);
        const report = this.adminReportRepository.create({
            tournamentId,
            attendanceCount: arrivedCount,
            cashRevenue,
            nonCashRevenue,
            expenses: [],
            totalProfit: cashRevenue + nonCashRevenue,
        });
        await this.adminReportRepository.save(report);
        console.log(`🏁 Tournament ${tournamentId} finished → ARCHIVED`);
        // Создать результат для победителя (последнего оставшегося игрока), если его ещё нет
        const existingResults = await this.resultRepository.count({ where: { tournament: { id: tournamentId } } });
        const registrations = await this.registrationRepository.find({
            where: { tournament: { id: tournamentId }, isActive: true },
            relations: ['player'],
        });
        if (registrations.length === 1 && existingResults >= 0) {
            const winnerReg = registrations[0];
            const winnerPlayer = winnerReg.player;
            if (winnerPlayer && !(await this.resultRepository.findOne({ where: { tournament: { id: tournamentId }, player: { id: winnerPlayer.id } } }))) {
                const winnerResult = this.resultRepository.create({
                    tournament,
                    player: winnerPlayer,
                    finishPosition: 1,
                    isFinalTable: true,
                });
                await this.resultRepository.save(winnerResult);
                winnerReg.isActive = false;
                await this.registrationRepository.save(winnerReg);
            }
        }
        // 2. Удалить live state
        await this.liveStateService.deleteLiveState(tournamentId);
        // 3. Добавить тяжёлые задачи в очередь (MMR, лидерборды, статистика, достижения)
        await queues_1.tournamentQueue.add('finish-tournament', { type: 'FINISH_TOURNAMENT', tournamentId });
        console.log(`✅ Tournament ${tournamentId} finished, background jobs queued`);
    }
    /**
     * Вызывается воркером для выполнения тяжёлых операций после завершения турнира
     */
    async processFinishTournamentJobs(tournamentId) {
        console.log(`📊 Processing finish jobs for tournament ${tournamentId}...`);
        await this.mmrService.recalculateTournamentMMR(tournamentId);
        await this.leaderboardService.updateLeaderboardsAfterTournament(tournamentId);
        const results = await this.resultRepository
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.player', 'player')
            .leftJoinAndSelect('player.user', 'user')
            .where('result.tournamentId = :tournamentId', { tournamentId })
            .getMany();
        for (const result of results) {
            try {
                const userId = result.player?.user?.id;
                if (!userId)
                    continue;
                await this.statisticsService.updatePlayerStatistics(userId, tournamentId);
                const granted = await this.achievementService.checkAndGrantAchievements(userId, tournamentId);
                if (granted.length > 0) {
                    console.log(`🏆 Player ${userId} earned ${granted.length} achievement(s)`);
                }
            }
            catch (error) {
                console.error(`❌ Error processing player ${result.player?.id}:`, error);
            }
        }
        console.log(`✅ Tournament ${tournamentId} background jobs completed`);
    }
}
exports.LiveTournamentService = LiveTournamentService;
//# sourceMappingURL=LiveTournamentService.js.map