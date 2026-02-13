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
const FinancialService_1 = require("./FinancialService");
const Club_1 = require("../models/Club");
class TournamentService {
    constructor() {
        this.tournamentRepository = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.seriesRepository = database_1.AppDataSource.getRepository(TournamentSeries_1.TournamentSeries);
        this.registrationRepository = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.tournamentRewardRepository = database_1.AppDataSource.getRepository(TournamentReward_1.TournamentReward);
        this.rewardRepository = database_1.AppDataSource.getRepository(Reward_1.Reward);
        this.playerRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.clubRepository = database_1.AppDataSource.getRepository(Club_1.Club);
        this.financialService = new FinancialService_1.FinancialService();
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
            rebuyChips: data.rebuyChips ?? 0,
            blindStructureId: data.blindStructureId,
            status: 'REG_OPEN',
            currentLevelNumber: 0,
        });
        const saved = await this.tournamentRepository.save(tournament);
        if (data.rewards?.length) {
            await this.setTournamentRewards(saved.id, data.rewards);
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
     */
    async registerPlayer(tournamentId, playerProfileId, paymentMethod = 'DEPOSIT') {
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
        // Оплата с депозита: списать бай-ин до создания регистрации
        if (paymentMethod === 'DEPOSIT' && tournament.buyInCost > 0) {
            await this.financialService.deductBalance(playerProfileId, tournament.buyInCost, 'BUYIN', tournamentId);
        }
        const registration = this.registrationRepository.create({
            tournament,
            player,
            registeredAt: new Date(),
            paymentMethod,
            isActive: true,
            currentStack: tournament.startingStack,
        });
        try {
            await this.registrationRepository.save(registration);
            return registration;
        }
        catch (err) {
            // Откат: вернуть депозит при ошибке сохранения регистрации
            if (paymentMethod === 'DEPOSIT' && tournament.buyInCost > 0) {
                await this.financialService.addBalance(playerProfileId, tournament.buyInCost, 'REFUND', tournamentId);
            }
            throw err;
        }
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
    /**
     * Изменить статус турнира
     */
    async updateTournamentStatus(tournamentId, status) {
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
        // Возврат депозита при отмене регистрации (если платили с депозита)
        if (registration.paymentMethod === 'DEPOSIT' && tournament.buyInCost > 0) {
            await this.financialService.addBalance(playerProfile.id, tournament.buyInCost, 'REFUND', tournamentId);
        }
        await this.registrationRepository.remove(registration);
    }
}
exports.TournamentService = TournamentService;
//# sourceMappingURL=TournamentService.js.map