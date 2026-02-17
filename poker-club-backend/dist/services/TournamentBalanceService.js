"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentBalanceService = void 0;
const database_1 = require("../config/database");
const Tournament_1 = require("../models/Tournament");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const PlayerOperation_1 = require("../models/PlayerOperation");
const Order_1 = require("../models/Order");
const Order_2 = require("../models/Order");
const TournamentPayment_1 = require("../models/TournamentPayment");
class TournamentBalanceService {
    constructor() {
        this.tournamentRepo = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.registrationRepo = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.operationRepo = database_1.AppDataSource.getRepository(PlayerOperation_1.PlayerOperation);
        this.orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        this.paymentRepo = database_1.AppDataSource.getRepository(TournamentPayment_1.TournamentPayment);
    }
    /**
     * Баланс игрока = вход + ребаи + аддоны + заказы - оплаты
     */
    async getTournamentPlayerBalances(tournamentId) {
        const tournament = await this.tournamentRepo.findOne({
            where: { id: tournamentId },
        });
        if (!tournament)
            throw new Error('Tournament not found');
        const registrations = await this.registrationRepo.find({
            where: { tournament: { id: tournamentId } },
            relations: ['player', 'player.user'],
        });
        const result = [];
        for (const reg of registrations) {
            const player = reg.player;
            // Турнирные суммы в рублях, заказы в копейках — приводим всё к копейкам
            const buyInKopecks = (tournament.buyInCost ?? 0) * 100;
            const rebuyOps = await this.operationRepo.find({
                where: {
                    playerProfile: { id: player.id },
                    tournament: { id: tournamentId },
                    operationType: 'REBUY',
                },
            });
            const rebuysKopecks = rebuyOps.reduce((s, o) => s + o.amount * 100, 0);
            const rebuyCount = rebuyOps.length;
            const addonOps = await this.operationRepo.find({
                where: {
                    playerProfile: { id: player.id },
                    tournament: { id: tournamentId },
                    operationType: 'ADDON',
                },
            });
            const addonsKopecks = addonOps.reduce((s, o) => s + o.amount * 100, 0);
            const addonCount = addonOps.length;
            let ordersKopecks = 0;
            if (player.user?.id) {
                const orders = await this.orderRepo.find({
                    where: {
                        userId: player.user.id,
                        tournamentId,
                    },
                });
                ordersKopecks = orders
                    .filter((o) => o.status !== Order_2.OrderStatus.CANCELLED &&
                    (o.status === Order_2.OrderStatus.DELIVERED ||
                        o.status === Order_2.OrderStatus.READY ||
                        o.status === Order_2.OrderStatus.PREPARING ||
                        o.status === Order_2.OrderStatus.PENDING))
                    .reduce((s, o) => s + o.totalAmount, 0);
            }
            const payments = await this.paymentRepo.find({
                where: {
                    playerProfileId: player.id,
                    tournamentId,
                },
            });
            const paidAmount = payments.reduce((s, p) => s + p.cashAmount + p.nonCashAmount, 0);
            const balance = buyInKopecks + rebuysKopecks + addonsKopecks + ordersKopecks - paidAmount;
            const playerName = player.user?.name?.trim() || 'Игрок';
            const clubCardNumber = player.user?.clubCardNumber;
            result.push({
                playerId: player.id,
                playerName,
                clubCardNumber,
                balance,
                buyInAmount: buyInKopecks,
                rebuysAmount: rebuysKopecks,
                rebuyCount,
                addonsAmount: addonsKopecks,
                addonCount,
                ordersAmount: ordersKopecks,
                paidAmount,
            });
        }
        return result;
    }
    async recordPayment(tournamentId, playerProfileId, cashAmount, nonCashAmount) {
        const total = cashAmount + nonCashAmount;
        if (total <= 0)
            throw new Error('Сумма оплаты должна быть больше 0');
        const balances = await this.getTournamentPlayerBalances(tournamentId);
        const player = balances.find((b) => b.playerId === playerProfileId);
        if (!player)
            throw new Error('Игрок не найден в турнире');
        // Оплата — это запись факта внесения средств в реальной жизни, без проверки «достаточности»
        const payment = this.paymentRepo.create({
            playerProfileId,
            tournamentId,
            cashAmount,
            nonCashAmount,
        });
        return this.paymentRepo.save(payment);
    }
}
exports.TournamentBalanceService = TournamentBalanceService;
//# sourceMappingURL=TournamentBalanceService.js.map