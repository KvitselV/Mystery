"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatingController = void 0;
const SeatingService_1 = require("../services/SeatingService");
const LiveStateService_1 = require("../services/LiveStateService");
const seatingService = new SeatingService_1.SeatingService();
const liveStateService = new LiveStateService_1.LiveStateService();
class SeatingController {
    /**
     * POST /tournaments/:id/tables/init-from-club - Создать столы турнира из столов клуба
     * Только для администраторов. Вызывать при запуске турнира (турнир должен быть привязан к клубу).
     */
    static async initTablesFromClub(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const tournamentId = req.params.id;
            const result = await seatingService.initializeTablesFromClub(tournamentId);
            res.json({
                message: 'Tournament tables initialized from club',
                ...result,
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /tournaments/:id/seating/auto - Автоматическая рассадка
     * Только для администраторов
     */
    static async autoSeating(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const tournamentId = req.params.id;
            const result = await seatingService.autoSeating(tournamentId);
            await liveStateService.recalculateStats(tournamentId);
            res.json({
                message: 'Auto seating completed successfully',
                ...result,
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /tournaments/:id/seating/manual - Ручная пересадка игрока
     * Только для администраторов
     */
    static async manualReseating(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { playerId, newTableId, newSeatNumber } = req.body;
            if (!playerId || !newTableId || !newSeatNumber) {
                return res.status(400).json({
                    error: 'playerId, newTableId, and newSeatNumber are required',
                });
            }
            const seat = await seatingService.manualReseating(playerId, newTableId, newSeatNumber);
            res.json({
                message: 'Player reseated successfully',
                seat: {
                    id: seat.id,
                    tableId: seat.table.id,
                    tableNumber: seat.table.tableNumber,
                    seatNumber: seat.seatNumber,
                    playerName: seat.playerName,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /tournaments/:id/tables - Получить все столы турнира
     * Доступно администраторам и клиентам
     */
    static async getTournamentTables(req, res) {
        try {
            const tournamentId = req.params.id;
            const tables = await seatingService.getTournamentTables(tournamentId);
            res.json({
                tables: tables.map((table) => ({
                    id: table.id,
                    tableNumber: table.tableNumber,
                    clubTableId: table.clubTableId ?? undefined,
                    clubTable: table.clubTable
                        ? { id: table.clubTable.id, tableNumber: table.clubTable.tableNumber }
                        : undefined,
                    status: table.status,
                    occupiedSeats: table.occupiedSeats,
                    maxSeats: table.maxSeats,
                    seats: table.seats.map((seat) => ({
                        id: seat.id,
                        seatNumber: seat.seatNumber,
                        isOccupied: seat.isOccupied,
                        status: seat.status,
                        playerName: seat.playerName,
                        playerId: seat.player?.id,
                    })),
                })),
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /tournaments/:tournamentId/tables/:tableId - Получить детали стола
     * Доступно администраторам и клиентам
     */
    static async getTableDetails(req, res) {
        try {
            const tableId = req.params.tableId;
            const table = await seatingService.getTableDetails(tableId);
            res.json({
                table: {
                    id: table.id,
                    tableNumber: table.tableNumber,
                    clubTableId: table.clubTableId ?? undefined,
                    clubTable: table.clubTable
                        ? { id: table.clubTable.id, tableNumber: table.clubTable.tableNumber }
                        : undefined,
                    tournamentId: table.tournament.id,
                    status: table.status,
                    occupiedSeats: table.occupiedSeats,
                    maxSeats: table.maxSeats,
                    seats: table.seats.map((seat) => ({
                        id: seat.id,
                        seatNumber: seat.seatNumber,
                        isOccupied: seat.isOccupied,
                        status: seat.status,
                        playerName: seat.playerName,
                        playerId: seat.player?.id,
                        playerRank: seat.player?.rankCode,
                    })),
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /tournaments/:id/player/:playerId/eliminate - Исключить игрока
     * Только для администраторов
     */
    static async eliminatePlayer(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const playerId = req.params.playerId;
            const { finishPosition } = req.body;
            if (!finishPosition) {
                return res.status(400).json({ error: 'finishPosition is required' });
            }
            const seat = await seatingService.eliminatePlayer(playerId, finishPosition);
            res.json({
                message: 'Player eliminated successfully',
                seat: {
                    id: seat.id,
                    tableId: seat.table.id,
                    status: seat.status,
                    playerName: seat.playerName,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
}
exports.SeatingController = SeatingController;
//# sourceMappingURL=SeatingController.js.map