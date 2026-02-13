"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialService = void 0;
const database_1 = require("../config/database");
const PlayerProfile_1 = require("../models/PlayerProfile");
const PlayerBalance_1 = require("../models/PlayerBalance");
const PlayerOperation_1 = require("../models/PlayerOperation");
const Tournament_1 = require("../models/Tournament");
class FinancialService {
    constructor() {
        this.playerProfileRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.playerBalanceRepository = database_1.AppDataSource.getRepository(PlayerBalance_1.PlayerBalance);
        this.playerOperationRepository = database_1.AppDataSource.getRepository(PlayerOperation_1.PlayerOperation);
        this.tournamentRepository = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
    }
    async topupDeposit(playerId, amount) {
        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        const player = await this.playerProfileRepository.findOne({
            where: { id: playerId },
            relations: ['balance'],
        });
        if (!player) {
            throw new Error('Player not found');
        }
        if (!player.balance) {
            player.balance = this.playerBalanceRepository.create({
                playerProfile: player, // ✅ ИЗМЕНЕНО
                depositBalance: 0,
                totalDeposited: 0,
            });
        }
        // Добавь депозит
        player.balance.depositBalance += amount;
        player.balance.totalDeposited += amount;
        player.balance.updatedAt = new Date();
        const updatedBalance = await this.playerBalanceRepository.save(player.balance);
        // Запиши операцию
        const operation = this.playerOperationRepository.create({
            playerProfile: player, // ✅ УЖЕ ПРАВИЛЬНО
            operationType: 'DEPOSIT_TOPUP',
            amount,
            // tournament: undefined убрано, так как необязательно
        });
        await this.playerOperationRepository.save(operation);
        return updatedBalance;
    }
    async getBalance(playerId) {
        const player = await this.playerProfileRepository.findOne({
            where: { id: playerId },
            relations: ['balance'],
        });
        if (!player) {
            throw new Error('Player not found');
        }
        if (!player.balance) {
            const newBalance = this.playerBalanceRepository.create({
                playerProfile: player,
                depositBalance: 0,
                totalDeposited: 0,
            });
            return await this.playerBalanceRepository.save(newBalance);
        }
        return player.balance;
    }
    /**
     * Списание с депозита за участие в турнире: бай-ин (регистрация), ребай, аддон.
     * При оплате CASH списание не выполняется (оплата на месте).
     */
    async deductBalance(playerId, amount, operationType, tournamentId) {
        const player = await this.playerProfileRepository.findOne({
            where: { id: playerId },
            relations: ['balance'],
        });
        if (!player || !player.balance) {
            throw new Error('Player or balance not found');
        }
        if (player.balance.depositBalance < amount) {
            throw new Error('Insufficient balance');
        }
        player.balance.depositBalance -= amount;
        player.balance.updatedAt = new Date();
        const updatedBalance = await this.playerBalanceRepository.save(player.balance);
        // Запиши операцию
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
        });
        const operation = this.playerOperationRepository.create({
            playerProfile: player, // ✅ ИЗМЕНЕНО
            operationType,
            amount,
            tournament: tournament || undefined, // ✅ ИЗМЕНЕНО
        });
        await this.playerOperationRepository.save(operation);
        return updatedBalance;
    }
    /**
     * Зачисление на депозит: только REFUND (возврат при отмене регистрации на турнир).
     * Денежных призов за победу/места нет — призы назначает админ (немонетарные Reward).
     */
    async addBalance(playerId, amount, operationType, tournamentId) {
        const player = await this.playerProfileRepository.findOne({
            where: { id: playerId },
            relations: ['balance'],
        });
        if (!player) {
            throw new Error('Player not found');
        }
        if (!player.balance) {
            player.balance = this.playerBalanceRepository.create({
                playerProfile: player, // ✅ ИЗМЕНЕНО
                depositBalance: 0,
                totalDeposited: 0,
            });
        }
        player.balance.depositBalance += amount;
        player.balance.updatedAt = new Date();
        const updatedBalance = await this.playerBalanceRepository.save(player.balance);
        // Запиши операцию
        const tournament = tournamentId
            ? await this.tournamentRepository.findOne({ where: { id: tournamentId } })
            : undefined; // ✅ ИЗМЕНЕНО
        const operation = this.playerOperationRepository.create({
            playerProfile: player, // ✅ ИЗМЕНЕНО
            operationType,
            amount,
            ...(tournament && { tournament }),
        });
        await this.playerOperationRepository.save(operation);
        return updatedBalance;
    }
    async getOperationHistory(playerId, limit = 50, offset = 0) {
        const [operations, total] = await this.playerOperationRepository.findAndCount({
            where: { playerProfile: { id: playerId } }, // ✅ ИЗМЕНЕНО
            relations: ['tournament'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
        return { operations, total };
    }
}
exports.FinancialService = FinancialService;
//# sourceMappingURL=FinancialService.js.map