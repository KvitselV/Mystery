"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClubService = void 0;
const database_1 = require("../config/database");
const Club_1 = require("../models/Club");
const ClubTable_1 = require("../models/ClubTable");
const ClubSchedule_1 = require("../models/ClubSchedule");
class ClubService {
    constructor() {
        this.clubRepository = database_1.AppDataSource.getRepository(Club_1.Club);
        this.clubTableRepository = database_1.AppDataSource.getRepository(ClubTable_1.ClubTable);
        this.clubScheduleRepository = database_1.AppDataSource.getRepository(ClubSchedule_1.ClubSchedule);
    }
    /**
     * Создать клуб с заданным количеством столов
     */
    async createClub(data) {
        const club = this.clubRepository.create({
            name: data.name,
            description: data.description,
            address: data.address,
            phone: data.phone,
            tableCount: data.tableCount,
            isActive: true,
        });
        const savedClub = await this.clubRepository.save(club);
        // Создать столы для клуба
        const tables = [];
        for (let i = 1; i <= data.tableCount; i++) {
            const table = this.clubTableRepository.create({
                club: savedClub,
                tableNumber: i,
                maxSeats: 9,
                status: 'AVAILABLE',
            });
            tables.push(table);
        }
        await this.clubTableRepository.save(tables);
        // Загрузить клуб со столами
        return await this.clubRepository.findOne({
            where: { id: savedClub.id },
            relations: ['tables'],
        });
    }
    /**
     * Получить список всех клубов
     */
    async getClubs(filters) {
        const where = {};
        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        const [clubs, total] = await this.clubRepository.findAndCount({
            where,
            relations: ['tables'],
            order: { createdAt: 'DESC' },
            take: filters?.limit || 50,
            skip: filters?.offset || 0,
        });
        return { clubs, total };
    }
    /**
     * Получить клуб по ID
     */
    async getClubById(clubId) {
        const club = await this.clubRepository.findOne({
            where: { id: clubId },
            relations: ['tables', 'schedules', 'tournaments'],
        });
        if (!club) {
            throw new Error('Club not found');
        }
        return club;
    }
    /**
     * Обновить информацию о клубе
     */
    async updateClub(clubId, data) {
        const club = await this.clubRepository.findOne({
            where: { id: clubId },
        });
        if (!club) {
            throw new Error('Club not found');
        }
        if (data.name !== undefined)
            club.name = data.name;
        if (data.description !== undefined)
            club.description = data.description;
        if (data.address !== undefined)
            club.address = data.address;
        if (data.phone !== undefined)
            club.phone = data.phone;
        if (data.isActive !== undefined)
            club.isActive = data.isActive;
        return await this.clubRepository.save(club);
    }
    /**
     * Удалить клуб
     */
    async deleteClub(clubId) {
        const club = await this.clubRepository.findOne({
            where: { id: clubId },
        });
        if (!club) {
            throw new Error('Club not found');
        }
        await this.clubRepository.remove(club);
    }
    /**
     * Добавить расписание для клуба
     */
    async addSchedule(clubId, data) {
        const club = await this.clubRepository.findOne({
            where: { id: clubId },
        });
        if (!club) {
            throw new Error('Club not found');
        }
        const schedule = this.clubScheduleRepository.create({
            club,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            eventType: data.eventType,
            description: data.description,
            isActive: true,
        });
        return await this.clubScheduleRepository.save(schedule);
    }
    /**
     * Получить расписание клуба
     */
    async getClubSchedules(clubId, filters) {
        const where = { club: { id: clubId } };
        if (filters?.dayOfWeek !== undefined) {
            where.dayOfWeek = filters.dayOfWeek;
        }
        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        return await this.clubScheduleRepository.find({
            where,
            order: { dayOfWeek: 'ASC', startTime: 'ASC' },
        });
    }
    /**
     * Обновить расписание
     */
    async updateSchedule(scheduleId, data) {
        const schedule = await this.clubScheduleRepository.findOne({
            where: { id: scheduleId },
        });
        if (!schedule) {
            throw new Error('Schedule not found');
        }
        if (data.dayOfWeek !== undefined)
            schedule.dayOfWeek = data.dayOfWeek;
        if (data.startTime !== undefined)
            schedule.startTime = data.startTime;
        if (data.endTime !== undefined)
            schedule.endTime = data.endTime;
        if (data.eventType !== undefined)
            schedule.eventType = data.eventType;
        if (data.description !== undefined)
            schedule.description = data.description;
        if (data.isActive !== undefined)
            schedule.isActive = data.isActive;
        return await this.clubScheduleRepository.save(schedule);
    }
    /**
     * Удалить расписание
     */
    async deleteSchedule(scheduleId) {
        const schedule = await this.clubScheduleRepository.findOne({
            where: { id: scheduleId },
        });
        if (!schedule) {
            throw new Error('Schedule not found');
        }
        await this.clubScheduleRepository.remove(schedule);
    }
    /**
     * Получить столы клуба
     */
    async getClubTables(clubId) {
        return await this.clubTableRepository.find({
            where: { club: { id: clubId } },
            order: { tableNumber: 'ASC' },
        });
    }
    /**
     * Обновить статус стола
     */
    async updateTableStatus(tableId, status) {
        const table = await this.clubTableRepository.findOne({
            where: { id: tableId },
        });
        if (!table) {
            throw new Error('Table not found');
        }
        table.status = status;
        return await this.clubTableRepository.save(table);
    }
}
exports.ClubService = ClubService;
//# sourceMappingURL=ClubService.js.map