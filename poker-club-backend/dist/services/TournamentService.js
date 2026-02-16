"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentService = void 0;
const database_1 = require("../config/database");
const Tournament_1 = require("../models/Tournament");
const TournamentSeries_1 = require("../models/TournamentSeries");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const TournamentReward_1 = require("../models/TournamentReward");
const Reward_1 = require("../models/Reward");
const PlayerProfile_1 = require("../models/PlayerProfile");
const PlayerOperation_1 = require("../models/PlayerOperation");
const PlayerBill_1 = require("../models/PlayerBill");
const Order_1 = require("../models/Order");
const AchievementInstance_1 = require("../models/AchievementInstance");
const FinancialService_1 = require("./FinancialService");
const Club_1 = require("../models/Club");
const SeatingService_1 = require("./SeatingService");
const LiveStateService_1 = require("./LiveStateService");
class TournamentService {
    constructor() {
        this.tournamentRepository = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.seriesRepository = database_1.AppDataSource.getRepository(TournamentSeries_1.TournamentSeries);
        this.seatingService = new SeatingService_1.SeatingService();
        this.liveStateService = new LiveStateService_1.LiveStateService();
        this.registrationRepository = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.tournamentRewardRepository = database_1.AppDataSource.getRepository(TournamentReward_1.TournamentReward);
        this.rewardRepository = database_1.AppDataSource.getRepository(Reward_1.Reward);
        this.playerRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.clubRepository = database_1.AppDataSource.getRepository(Club_1.Club);
        this.financialService = new FinancialService_1.FinancialService();
        this.playerOperationRepository = database_1.AppDataSource.getRepository(PlayerOperation_1.PlayerOperation);
        this.playerBillRepository = database_1.AppDataSource.getRepository(PlayerBill_1.PlayerBill);
        this.orderRepository = database_1.AppDataSource.getRepository(Order_1.Order);
        this.achievementInstanceRepository = database_1.AppDataSource.getRepository(AchievementInstance_1.AchievementInstance);
    }
    /**
     * Создать турнир
     */
    async createTournament(data) {
        const series = data.seriesId
            ? await this.seriesRepository.findOne({ where: { id: data.seriesId } })
            : null;
        const club = data.clubId
            ? await this.clubRepository.findOne({ where: { id: data.clubId } })
            : null;
        if (data.clubId && !club) {
            throw new Error('Club not found');
        }
        const tournament = this.tournamentRepository.create({
            name: data.name,
            series: series || undefined,
            club: club || undefined,
            clubId: club?.id,
            startTime: data.startTime,
            buyInCost: data.buyInCost,
            startingStack: data.startingStack,
            addonChips: data.addonChips ?? 0,
            addonCost: data.addonCost ?? 0,
            rebuyChips: data.rebuyChips ?? 0,
            rebuyCost: data.rebuyCost ?? 0,
            maxRebuys: data.maxRebuys ?? 0,
            maxAddons: data.maxAddons ?? 0,
            blindStructureId: data.blindStructureId,
            status: 'REG_OPEN',
            currentLevelNumber: 0,
        });
        const saved = await this.tournamentRepository.save(tournament);
        if (data.rewards?.length) {
            await this.setTournamentRewards(saved.id, data.rewards);
        }
        if (saved.clubId) {
            try {
                await this.seatingService.initializeTablesFromClub(saved.id);
            }
            catch (err) {
                console.warn('Auto-init tables from club failed:', err instanceof Error ? err.message : err);
            }
        }
        return await this.getTournamentById(saved.id);
    }
    /**
     * Установить награды турнира (место -> награда). Заменяет текущий список.
     */
    async setTournamentRewards(tournamentId, rewards) {
        const tournament = await this.tournamentRepository.findOne({ where: { id: tournamentId } });
        if (!tournament)
            throw new Error('Tournament not found');
        await this.tournamentRewardRepository.delete({ tournament: { id: tournamentId } });
        for (const { rewardId, place } of rewards) {
            const reward = await this.rewardRepository.findOne({ where: { id: rewardId } });
            if (!reward)
                throw new Error(`Reward not found: ${rewardId}`);
            const tr = this.tournamentRewardRepository.create({
                tournament,
                reward,
                place,
            });
            await this.tournamentRewardRepository.save(tr);
        }
    }
    /**
     * Получить список турниров
     */
    async getTournaments(filters) {
        const where = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.seriesId) {
            where.series = { id: filters.seriesId };
        }
        if (filters?.clubId) {
            where.club = { id: filters.clubId };
        }
        const [tournaments, total] = await this.tournamentRepository.findAndCount({
            where,
            relations: ['series', 'club', 'rewards', 'rewards.reward'],
            order: { startTime: 'ASC' },
            take: filters?.limit || 50,
            skip: filters?.offset || 0,
        });
        return { tournaments, total };
    }
    /**
     * Регистрация игрока на турнир
     * @param isArrived - если false, игрок зарегистрировался сам и ещё не прибыл в клуб
     */
    async registerPlayer(tournamentId, playerProfileId, paymentMethod = 'DEPOSIT', isArrived = true) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        if (tournament.status !== 'REG_OPEN' && tournament.status !== 'LATE_REG') {
            throw new Error('Tournament is not open for registration');
        }
        // Проверь, не зарегистрирован ли уже
        const existingReg = await this.registrationRepository.findOne({
            where: {
                tournament: { id: tournamentId },
                player: { id: playerProfileId },
            },
        });
        if (existingReg) {
            throw new Error('Player already registered');
        }
        const player = await this.playerRepository.findOne({
            where: { id: playerProfileId },
        });
        if (!player) {
            throw new Error('Player not found');
        }
        // Оплата в конце турнира: бай-ин учитывается в турнирном балансе, списание при оплате
        const buyInAmount = tournament.buyInCost ?? 0;
        if (buyInAmount > 0) {
            const operation = this.playerOperationRepository.create({
                playerProfile: player,
                operationType: 'BUYIN',
                amount: buyInAmount,
                tournament,
            });
            await this.playerOperationRepository.save(operation);
        }
        const registration = this.registrationRepository.create({
            tournament,
            player,
            registeredAt: new Date(),
            paymentMethod,
            isActive: true,
            isArrived,
            currentStack: tournament.startingStack,
        });
        await this.registrationRepository.save(registration);
        return registration;
    }
    /**
     * Получить участников турнира
     */
    async getTournamentPlayers(tournamentId) {
        return await this.registrationRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['player', 'player.user'],
            order: { registeredAt: 'ASC' },
        });
    }
    /** Отметить игрока как прибывшего в клуб (управляющий нажал «Прибыл») */
    async markPlayerArrived(tournamentId, registrationId, managedClubId) {
        await this.ensureTournamentBelongsToClub(tournamentId, managedClubId);
        const registration = await this.registrationRepository.findOne({
            where: { id: registrationId, tournament: { id: tournamentId } },
            relations: ['player', 'player.user'],
        });
        if (!registration)
            throw new Error('Registration not found');
        registration.isArrived = true;
        await this.registrationRepository.save(registration);
        return registration;
    }
    async ensureTournamentBelongsToClub(tournamentId, managedClubId) {
        const tournament = await this.tournamentRepository.findOne({ where: { id: tournamentId } });
        if (!tournament)
            throw new Error('Tournament not found');
        if (managedClubId && tournament.clubId !== managedClubId) {
            throw new Error('Forbidden: tournament belongs to another club');
        }
        return tournament;
    }
    async updateTournament(tournamentId, data, managedClubId) {
        await this.ensureTournamentBelongsToClub(tournamentId, managedClubId);
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament)
            throw new Error('Tournament not found');
        if (data.name != null)
            tournament.name = data.name;
        if (data.startTime != null)
            tournament.startTime = data.startTime;
        if (data.buyInCost != null)
            tournament.buyInCost = data.buyInCost;
        if (data.startingStack != null)
            tournament.startingStack = data.startingStack;
        if (data.addonChips != null)
            tournament.addonChips = data.addonChips;
        if (data.addonCost != null)
            tournament.addonCost = data.addonCost;
        if (data.rebuyChips != null)
            tournament.rebuyChips = data.rebuyChips;
        if (data.rebuyCost != null)
            tournament.rebuyCost = data.rebuyCost;
        if (data.maxRebuys != null)
            tournament.maxRebuys = data.maxRebuys;
        if (data.maxAddons != null)
            tournament.maxAddons = data.maxAddons;
        if (data.blindStructureId != null)
            tournament.blindStructureId = data.blindStructureId;
        if (data.clubId != null)
            tournament.clubId = data.clubId;
        if (data.seriesId !== undefined) {
            if (data.seriesId) {
                const series = await this.seriesRepository.findOne({ where: { id: data.seriesId } });
                if (series)
                    tournament.series = series;
            }
            else {
                tournament.series = null;
            }
        }
        if (data.clubId !== undefined && data.clubId) {
            const club = await this.clubRepository.findOne({ where: { id: data.clubId } });
            tournament.club = club ?? null;
        }
        else if (data.clubId === null) {
            tournament.club = null;
        }
        return this.tournamentRepository.save(tournament);
    }
    async deleteTournament(tournamentId, managedClubId, options) {
        if (!options?.force) {
            await this.ensureTournamentBelongsToClub(tournamentId, managedClubId);
        }
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament)
            throw new Error('Tournament not found');
        if (!options?.force && tournament.status !== 'REG_OPEN' && tournament.status !== 'ARCHIVED') {
            throw new Error('Can only delete tournaments in REG_OPEN or ARCHIVED status');
        }
        // Явно удаляем связанные записи (обходим FK-ограничения при старом schema)
        await this.liveStateService.deleteLiveState(tournamentId);
        await this.playerOperationRepository.delete({ tournament: { id: tournamentId } });
        await this.playerBillRepository.delete({ tournament: { id: tournamentId } });
        await this.orderRepository.update({ tournamentId }, { tournamentId: null });
        await this.achievementInstanceRepository.update({ tournamentId }, { tournamentId: null });
        await this.tournamentRepository.remove(tournament);
    }
    async updateTournamentStatus(tournamentId, status, managedClubId) {
        await this.ensureTournamentBelongsToClub(tournamentId, managedClubId);
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        tournament.status = status;
        return await this.tournamentRepository.save(tournament);
    }
    /**
     * Получить турнир по ID
     */
    async getTournamentById(tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: ['series', 'club', 'registrations', 'rewards', 'rewards.reward'],
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        return tournament;
    }
    /**
 * Отменить регистрацию на турнир
 */
    async unregisterFromTournament(userId, tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        // Проверка статуса турнира
        if (tournament.status !== 'REG_OPEN') {
            throw new Error('Cannot unregister from started or completed tournament');
        }
        const playerProfile = await this.playerRepository.findOne({
            where: { user: { id: userId } },
            relations: ['user', 'balance'],
        });
        if (!playerProfile) {
            throw new Error('Player profile not found');
        }
        // Найти регистрацию
        const registration = await this.registrationRepository.findOne({
            where: {
                tournament: { id: tournamentId },
                player: { id: playerProfile.id },
            },
        });
        if (!registration) {
            throw new Error('Registration not found');
        }
        // Удалить операцию BUYIN (бай-ин был в турнирном счёте)
        await this.playerOperationRepository.delete({
            playerProfile: { id: playerProfile.id },
            tournament: { id: tournamentId },
            operationType: 'BUYIN',
        });
        await this.registrationRepository.remove(registration);
    }
}
exports.TournamentService = TournamentService;
//# sourceMappingURL=TournamentService.js.map