"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillService = void 0;
const database_1 = require("../config/database");
const PlayerBill_1 = require("../models/PlayerBill");
const PlayerProfile_1 = require("../models/PlayerProfile");
class BillService {
    constructor() {
        this.billRepo = database_1.AppDataSource.getRepository(PlayerBill_1.PlayerBill);
        this.profileRepo = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
    }
    /**
     * Счета текущего пользователя (по userId)
     */
    async getBillsByUserId(userId) {
        const profile = await this.profileRepo.findOne({
            where: { user: { id: userId } },
        });
        if (!profile)
            return [];
        return this.billRepo.find({
            where: { playerProfile: { id: profile.id } },
            relations: ['tournament', 'playerProfile', 'playerProfile.user'],
            order: { createdAt: 'DESC' },
        });
    }
    /**
     * Один счёт по id; проверка, что счёт принадлежит пользователю (или любой для admin)
     */
    async getBillById(billId, userId, isAdmin) {
        const bill = await this.billRepo.findOne({
            where: { id: billId },
            relations: ['tournament', 'playerProfile', 'playerProfile.user'],
        });
        if (!bill)
            return null;
        if (isAdmin)
            return bill;
        const profile = await this.profileRepo.findOne({
            where: { user: { id: userId } },
        });
        if (!profile || bill.playerProfileId !== profile.id)
            return null;
        return bill;
    }
    /**
     * Все счета (админ), с опциональными фильтрами
     */
    async getAllBills(filters) {
        const qb = this.billRepo
            .createQueryBuilder('bill')
            .leftJoinAndSelect('bill.tournament', 'tournament')
            .leftJoinAndSelect('bill.playerProfile', 'playerProfile')
            .leftJoinAndSelect('playerProfile.user', 'user')
            .orderBy('bill.createdAt', 'DESC');
        if (filters?.tournamentId) {
            qb.andWhere('bill.tournamentId = :tournamentId', {
                tournamentId: filters.tournamentId,
            });
        }
        if (filters?.playerProfileId) {
            qb.andWhere('bill.playerProfileId = :playerProfileId', {
                playerProfileId: filters.playerProfileId,
            });
        }
        if (filters?.status) {
            qb.andWhere('bill.status = :status', { status: filters.status });
        }
        const total = await qb.getCount();
        if (filters?.limit != null) {
            qb.take(filters.limit);
        }
        if (filters?.offset != null) {
            qb.skip(filters.offset);
        }
        const bills = await qb.getMany();
        return { bills, total };
    }
    /**
     * Обновить статус счёта (оплачен) — только админ
     */
    async updateBillStatus(billId, status) {
        const bill = await this.billRepo.findOne({
            where: { id: billId },
            relations: ['tournament', 'playerProfile'],
        });
        if (!bill) {
            throw new Error('Bill not found');
        }
        bill.status = status;
        return this.billRepo.save(bill);
    }
}
exports.BillService = BillService;
//# sourceMappingURL=BillService.js.map