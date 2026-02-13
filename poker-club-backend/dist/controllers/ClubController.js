"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClubController = void 0;
const ClubService_1 = require("../services/ClubService");
const clubService = new ClubService_1.ClubService();
class ClubController {
    /**
     * POST /clubs - Создать клуб (только админ)
     */
    static async createClub(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { name, description, address, phone, tableCount } = req.body;
            if (!name || !tableCount) {
                return res.status(400).json({ error: 'Name and tableCount are required' });
            }
            if (tableCount < 1 || tableCount > 100) {
                return res.status(400).json({ error: 'Table count must be between 1 and 100' });
            }
            const club = await clubService.createClub({
                name,
                description,
                address,
                phone,
                tableCount,
            });
            res.status(201).json(club);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /clubs - Получить список клубов
     */
    static async getClubs(req, res) {
        try {
            const isActiveRaw = req.query.isActive;
            const limitRaw = req.query.limit;
            const offsetRaw = req.query.offset;
            const isActive = typeof isActiveRaw === 'string' ? isActiveRaw === 'true' : undefined;
            const limit = typeof limitRaw === 'string' ? parseInt(limitRaw) : 50;
            const offset = typeof offsetRaw === 'string' ? parseInt(offsetRaw) : 0;
            const { clubs, total } = await clubService.getClubs({
                isActive,
                limit,
                offset,
            });
            res.json({ clubs, total });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /clubs/:id - Получить клуб по ID
     */
    static async getClubById(req, res) {
        try {
            const clubIdRaw = req.params.id;
            const clubId = Array.isArray(clubIdRaw) ? clubIdRaw[0] : clubIdRaw;
            const club = await clubService.getClubById(clubId);
            res.json(club);
        }
        catch (error) {
            res.status(404).json({ error: error instanceof Error ? error.message : 'Not found' });
        }
    }
    /**
     * PATCH /clubs/:id - Обновить клуб (только админ)
     */
    static async updateClub(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const clubIdRaw = req.params.id;
            const clubId = Array.isArray(clubIdRaw) ? clubIdRaw[0] : clubIdRaw;
            const { name, description, address, phone, isActive } = req.body;
            const club = await clubService.updateClub(clubId, {
                name,
                description,
                address,
                phone,
                isActive,
            });
            res.json(club);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * DELETE /clubs/:id - Удалить клуб (только админ)
     */
    static async deleteClub(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const clubIdRaw = req.params.id;
            const clubId = Array.isArray(clubIdRaw) ? clubIdRaw[0] : clubIdRaw;
            await clubService.deleteClub(clubId);
            res.json({ message: 'Club deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /clubs/:id/tables - Получить столы клуба
     */
    static async getClubTables(req, res) {
        try {
            const clubIdRaw = req.params.id;
            const clubId = Array.isArray(clubIdRaw) ? clubIdRaw[0] : clubIdRaw;
            const tables = await clubService.getClubTables(clubId);
            res.json({ tables });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * PATCH /clubs/:id/tables/:tableId/status - Обновить статус стола (только админ)
     */
    static async updateTableStatus(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const tableIdRaw = req.params.tableId;
            const tableId = Array.isArray(tableIdRaw) ? tableIdRaw[0] : tableIdRaw;
            const { status } = req.body;
            if (!status || !['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            const table = await clubService.updateTableStatus(tableId, status);
            res.json(table);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /clubs/:id/schedules - Добавить расписание (только админ)
     */
    static async addSchedule(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const clubIdRaw = req.params.id;
            const clubId = Array.isArray(clubIdRaw) ? clubIdRaw[0] : clubIdRaw;
            const { dayOfWeek, startTime, endTime, eventType, description } = req.body;
            if (dayOfWeek === undefined || !startTime || !endTime) {
                return res.status(400).json({ error: 'dayOfWeek, startTime, and endTime are required' });
            }
            if (dayOfWeek < 0 || dayOfWeek > 6) {
                return res.status(400).json({ error: 'dayOfWeek must be between 0 and 6' });
            }
            const schedule = await clubService.addSchedule(clubId, {
                dayOfWeek,
                startTime,
                endTime,
                eventType,
                description,
            });
            res.status(201).json(schedule);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /clubs/:id/schedules - Получить расписание клуба
     */
    static async getClubSchedules(req, res) {
        try {
            const clubIdRaw = req.params.id;
            const clubId = Array.isArray(clubIdRaw) ? clubIdRaw[0] : clubIdRaw;
            const dayOfWeekRaw = req.query.dayOfWeek;
            const isActiveRaw = req.query.isActive;
            const dayOfWeek = typeof dayOfWeekRaw === 'string' ? parseInt(dayOfWeekRaw) : undefined;
            const isActive = typeof isActiveRaw === 'string' ? isActiveRaw === 'true' : undefined;
            const schedules = await clubService.getClubSchedules(clubId, {
                dayOfWeek,
                isActive,
            });
            res.json({ schedules });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * PATCH /clubs/:id/schedules/:scheduleId - Обновить расписание (только админ)
     */
    static async updateSchedule(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const scheduleIdRaw = req.params.scheduleId;
            const scheduleId = Array.isArray(scheduleIdRaw) ? scheduleIdRaw[0] : scheduleIdRaw;
            const { dayOfWeek, startTime, endTime, eventType, description, isActive } = req.body;
            const schedule = await clubService.updateSchedule(scheduleId, {
                dayOfWeek,
                startTime,
                endTime,
                eventType,
                description,
                isActive,
            });
            res.json(schedule);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * DELETE /clubs/:id/schedules/:scheduleId - Удалить расписание (только админ)
     */
    static async deleteSchedule(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const scheduleIdRaw = req.params.scheduleId;
            const scheduleId = Array.isArray(scheduleIdRaw) ? scheduleIdRaw[0] : scheduleIdRaw;
            await clubService.deleteSchedule(scheduleId);
            res.json({ message: 'Schedule deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
}
exports.ClubController = ClubController;
//# sourceMappingURL=ClubController.js.map