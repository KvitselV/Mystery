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
const FinancialService_1 = require("./FinancialService");
const PlayerBill_1 = require("../models/PlayerBill");
const Order_1 = require("../models/Order");
const Order_2 = require("../models/Order");
class LiveTournamentService {
    constructor() {
        this.tournamentRepository = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.playerRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.operationRepository = database_1.AppDataSource.getRepository(PlayerOperation_1.PlayerOperation);
        this.registrationRepository = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.resultRepository = database_1.AppDataSource.getRepository(TournamentResult_1.TournamentResult);
        this.blindStructureRepository = database_1.AppDataSource.getRepository(BlindStructure_1.BlindStructure);
        this.levelRepository = database_1.AppDataSource.getRepository(TournamentLevel_1.TournamentLevel);
        this.billRepository = database_1.AppDataSource.getRepository(PlayerBill_1.PlayerBill);
        this.orderRepository = database_1.AppDataSource.getRepository(Order_1.Order);
        this.liveStateService = new LiveStateService_1.LiveStateService();
        this.seatingService = new SeatingService_1.SeatingService();
        this.mmrService = new MMRService_1.MMRService();
        this.leaderboardService = new LeaderboardService_1.LeaderboardService();
        this.achievementService = new AchievementService_1.AchievementService();
        this.statisticsService = new StatisticsService_1.StatisticsService();
        this.financialService = new FinancialService_1.FinancialService();
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
        const rebuyAmount = amount ?? tournament.buyInCost;
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
        // Списание с депозита только при оплате DEPOSIT; при CASH счёт выставится после вылета
        if (rebuyAmount > 0 && registration.paymentMethod === 'DEPOSIT') {
            await this.financialService.deductBalance(playerProfileId, rebuyAmount, 'REBUY', tournamentId);
        }
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
        // Списание с депозита только при оплате DEPOSIT; при CASH счёт выставится после вылета
        if (amount > 0 && registration.paymentMethod === 'DEPOSIT') {
            await this.financialService.deductBalance(playerProfileId, amount, 'ADDON', tournamentId);
        }
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
     * Выбытие игрока с записью результата
     */
    async eliminatePlayer(tournamentId, playerProfileId, finishPosition) {
        console.log('ELIMINATE CALLED:', {
            tournamentId,
            playerProfileId,
            finishPosition,
        });
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament) {
            console.error('ELIMINATE ERROR: Tournament not found');
            throw new Error('Tournament not found');
        }
        const player = await this.playerRepository.findOne({
            where: { id: playerProfileId },
            relations: ['balance', 'user'],
        });
        if (!player) {
            console.error('ELIMINATE ERROR: Player not found');
            throw new Error('Player not found');
        }
        await this.seatingService.eliminatePlayer(playerProfileId, finishPosition);
        await this.liveStateService.recalculateStats(tournamentId);
        console.log('CREATING RESULT:', {
            tournamentId: tournament.id,
            playerId: player.id,
            finishPosition,
        });
        const result = this.resultRepository.create({
            tournament,
            player,
            finishPosition,
            isFinalTable: finishPosition <= 9,
        });
        const savedResult = await this.resultRepository.save(result);
        console.log('SAVED RESULT ID:', savedResult.id);
        // Для игрока с оплатой CASH выставляем счёт после вылета: вход + ребаи + аддоны + заказы в долг
        const registration = await this.registrationRepository.findOne({
            where: {
                tournament: { id: tournamentId },
                player: { id: playerProfileId },
            },
        });
        if (registration && registration.paymentMethod === 'CASH') {
            const buyInAmount = tournament.buyInCost ?? 0;
            const rebuyOps = await this.operationRepository.find({
                where: {
                    playerProfile: { id: playerProfileId },
                    tournament: { id: tournamentId },
                    operationType: 'REBUY',
                },
            });
            const addonOps = await this.operationRepository.find({
                where: {
                    playerProfile: { id: playerProfileId },
                    tournament: { id: tournamentId },
                    operationType: 'ADDON',
                },
            });
            const rebuysAmount = rebuyOps.reduce((s, o) => s + o.amount, 0);
            const addonsAmount = addonOps.reduce((s, o) => s + o.amount, 0);
            let ordersAmount = 0;
            if (player.user?.id) {
                const creditOrders = await this.orderRepository.find({
                    where: {
                        userId: player.user.id,
                        tournamentId,
                        paymentMethod: Order_2.OrderPaymentMethod.CREDIT,
                    },
                });
                ordersAmount = creditOrders
                    .filter((o) => o.status !== Order_2.OrderStatus.CANCELLED)
                    .reduce((s, o) => s + o.totalAmount, 0);
            }
            const totalAmount = buyInAmount + rebuysAmount + addonsAmount + ordersAmount;
            if (totalAmount > 0) {
                const bill = this.billRepository.create({
                    playerProfile: player,
                    tournament,
                    amount: totalAmount,
                    buyInAmount,
                    rebuysAmount,
                    addonsAmount,
                    ordersAmount,
                    status: PlayerBill_1.PlayerBillStatus.PENDING,
                });
                await this.billRepository.save(bill);
                console.log(`📄 Bill created for player ${playerProfileId}: ${totalAmount}`);
            }
        }
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
        // Проверка что турнир в статусе RUNNING
        if (tournament.status !== 'RUNNING') {
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