"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillController = void 0;
const BillService_1 = require("../services/BillService");
const PlayerBill_1 = require("../models/PlayerBill");
const billService = new BillService_1.BillService();
class BillController {
    /**
     * GET /user/bills — счета текущего пользователя
     */
    static async getMyBills(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const bills = await billService.getBillsByUserId(req.user.userId);
            res.json(bills);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch bills';
            res.status(500).json({ error: message });
        }
    }
    /**
     * GET /user/bills/:id — один счёт (свой или админ)
     */
    static async getMyBillById(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const billId = req.params.id;
            const isAdmin = req.user.role === 'ADMIN';
            const bill = await billService.getBillById(billId, req.user.userId, isAdmin);
            if (!bill) {
                res.status(404).json({ error: 'Bill not found' });
                return;
            }
            res.json(bill);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch bill';
            res.status(500).json({ error: message });
        }
    }
    /**
     * GET /bills — все счета (админ), с фильтрами
     */
    static async getAllBills(req, res) {
        try {
            const tournamentId = req.query.tournamentId;
            const playerProfileId = req.query.playerProfileId;
            const status = req.query.status;
            const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
            const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
            const { bills, total } = await billService.getAllBills({
                tournamentId,
                playerProfileId,
                status,
                limit,
                offset,
            });
            res.json({ bills, total });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch bills';
            res.status(500).json({ error: message });
        }
    }
    /**
     * GET /bills/:id — счёт по id (админ или свой)
     */
    static async getBillById(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const billId = req.params.id;
            const isAdmin = req.user.role === 'ADMIN';
            const bill = await billService.getBillById(billId, req.user.userId, isAdmin);
            if (!bill) {
                res.status(404).json({ error: 'Bill not found' });
                return;
            }
            res.json(bill);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch bill';
            res.status(500).json({ error: message });
        }
    }
    /**
     * PATCH /bills/:id/status — изменить статус оплаты (админ)
     */
    static async updateBillStatus(req, res) {
        try {
            const billId = req.params.id;
            const { status } = req.body;
            if (!status || !Object.values(PlayerBill_1.PlayerBillStatus).includes(status)) {
                res.status(400).json({ error: 'Valid status required (PENDING | PAID)' });
                return;
            }
            const bill = await billService.updateBillStatus(billId, status);
            res.json(bill);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update bill status';
            res.status(error instanceof Error && message === 'Bill not found' ? 404 : 500).json({
                error: message,
            });
        }
    }
}
exports.BillController = BillController;
//# sourceMappingURL=BillController.js.map