"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatingService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const Tournament_1 = require("../models/Tournament");
const TournamentTable_1 = require("../models/TournamentTable");
const TableSeat_1 = require("../models/TableSeat");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const PlayerProfile_1 = require("../models/PlayerProfile");
class SeatingService {
    constructor() {
        this.tournamentRepository = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.tableRepository = database_1.AppDataSource.getRepository(TournamentTable_1.TournamentTable);
        this.seatRepository = database_1.AppDataSource.getRepository(TableSeat_1.TableSeat);
        this.registrationRepository = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.playerRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.maxSeatsPerTable = 9;
    }
    /**
     * Создать столы турнира из столов клуба (один турнирный стол на каждый стол клуба).
     * Столы создаются со статусом INACTIVE (без игроков).
     */
    async initializeTablesFromClub(tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: ['club', 'club.tables'],
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        if (!tournament.clubId || !tournament.club) {
            throw new Error('Tournament has no club');
        }
        const clubTables = tournament.club.tables;
        const tableCount = tournament.club.tableCount ?? 0;
        if (!clubTables?.length && tableCount < 1) {
            throw new Error('Club has no tables');
        }
        // Не создавать повторно, если столы уже есть
        const existing = await this.tableRepository.count({
            where: { tournament: { id: tournamentId } },
        });
        if (existing > 0) {
            return { tablesCreated: 0 };
        }
        const tables = clubTables?.length
            ? clubTables
                .sort((a, b) => a.tableNumber - b.tableNumber)
                .map((clubTable) => this.tableRepository.create({
                tournament,
                clubTable,
                clubTableId: clubTable.id,
                tableNumber: clubTable.tableNumber,
                maxSeats: clubTable.maxSeats ?? this.maxSeatsPerTable,
                occupiedSeats: 0,
                status: 'INACTIVE',
            }))
            : Array.from({ length: Math.max(1, tableCount) }, (_, i) => this.tableRepository.create({
                tournament,
                tableNumber: i + 1,
                maxSeats: this.maxSeatsPerTable,
                occupiedSeats: 0,
                status: 'INACTIVE',
            }));
        await this.tableRepository.save(tables);
        return { tablesCreated: tables.length };
    }
    /**
     * Автоматическая рассадка: рассаживает на пустые места только тех, кто не за столами.
     * Игроки, уже сидящие за столами, остаются на своих местах.
     */
    async autoSeating(tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: ['club', 'club.tables'],
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        const registrations = await this.registrationRepository.find({
            where: { tournament: { id: tournamentId }, isActive: true, isArrived: true },
            relations: ['player', 'player.user'],
        });
        if (registrations.length === 0) {
            throw new Error('No registrations found');
        }
        let tables = await this.tableRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['clubTable'],
            order: { tableNumber: 'ASC' },
        });
        if (tables.length === 0) {
            if (tournament.clubId && tournament.club?.tables?.length) {
                await this.initializeTablesFromClub(tournamentId);
            }
            else {
                const tableCount = Math.max(1, Math.ceil(registrations.length / this.maxSeatsPerTable));
                for (let i = 0; i < tableCount; i++) {
                    await this.tableRepository.save(this.tableRepository.create({
                        tournament,
                        tableNumber: i + 1,
                        maxSeats: this.maxSeatsPerTable,
                        occupiedSeats: 0,
                        status: 'INACTIVE',
                    }));
                }
            }
            tables = await this.tableRepository.find({
                where: { tournament: { id: tournamentId } },
                order: { tableNumber: 'ASC' },
            });
        }
        const tableIds = tables.map((t) => t.id);
        const allSeats = await this.seatRepository.find({
            where: { table: { id: (0, typeorm_1.In)(tableIds) } },
            relations: ['table', 'player'],
        });
        const seatedPlayerIds = new Set();
        const occupiedByTable = new Map();
        for (const seat of allSeats) {
            if (seat.isOccupied && seat.player && seat.status !== 'ELIMINATED') {
                seatedPlayerIds.add(seat.player.id);
            }
            if (!occupiedByTable.has(seat.table.id)) {
                occupiedByTable.set(seat.table.id, new Set());
            }
            if (seat.isOccupied) {
                occupiedByTable.get(seat.table.id).add(seat.seatNumber);
            }
        }
        const unseated = registrations.filter((r) => r.player?.user && !seatedPlayerIds.has(r.player.id));
        if (unseated.length === 0) {
            return { tablesCreated: 0, seatsAssigned: 0 };
        }
        const emptySlots = [];
        for (const table of tables) {
            const occupied = occupiedByTable.get(table.id) ?? new Set();
            const maxSeats = table.maxSeats ?? this.maxSeatsPerTable;
            for (let sn = 1; sn <= maxSeats; sn++) {
                if (occupied.has(sn))
                    continue;
                const existing = allSeats.find((s) => s.table.id === table.id && s.seatNumber === sn);
                if (existing) {
                    if (!existing.isOccupied && existing.status !== 'ELIMINATED') {
                        emptySlots.push({ table, seatNumber: sn, existingSeat: existing });
                    }
                }
                else {
                    emptySlots.push({ table, seatNumber: sn });
                }
            }
        }
        const shuffled = this.shuffleArray(unseated);
        let assigned = 0;
        for (let i = 0; i < shuffled.length && i < emptySlots.length; i++) {
            const reg = shuffled[i];
            const player = reg.player;
            const slot = emptySlots[i];
            const playerName = `${player.user.firstName} ${player.user.lastName}`;
            if (slot.existingSeat) {
                slot.existingSeat.isOccupied = true;
                slot.existingSeat.player = player;
                slot.existingSeat.playerName = playerName;
                slot.existingSeat.status = 'ACTIVE';
                await this.seatRepository.save(slot.existingSeat);
            }
            else {
                const seat = this.seatRepository.create({
                    table: slot.table,
                    seatNumber: slot.seatNumber,
                    player,
                    playerName,
                    isOccupied: true,
                    status: 'ACTIVE',
                });
                await this.seatRepository.save(seat);
            }
            slot.table.occupiedSeats = (slot.table.occupiedSeats ?? 0) + 1;
            if (slot.table.status === 'INACTIVE')
                slot.table.status = 'ACTIVE';
            assigned++;
        }
        await this.tableRepository.save(tables);
        return { tablesCreated: 0, seatsAssigned: assigned };
    }
    /**
     * Ручная пересадка игрока на другой стол/бокс.
     * Можно пересаживать на место, где раньше сидел другой игрок (оно будет свободным).
     */
    async manualReseating(tournamentId, playerId, newTableId, newSeatNumber) {
        const currentSeat = await this.seatRepository.findOne({
            where: {
                player: { id: playerId },
                table: { tournament: { id: tournamentId } },
            },
            relations: ['table'],
        });
        if (!currentSeat) {
            throw new Error('Player seat not found');
        }
        // Проверь что новое место свободно
        let newSeat = await this.seatRepository.findOne({
            where: {
                table: { id: newTableId },
                seatNumber: newSeatNumber,
            },
            relations: ['table'],
        });
        if (!newSeat) {
            const newTable = await this.tableRepository.findOne({
                where: { id: newTableId, tournament: { id: tournamentId } },
            });
            if (!newTable) {
                throw new Error('New table not found');
            }
            newSeat = this.seatRepository.create({
                table: newTable,
                seatNumber: newSeatNumber,
                isOccupied: false,
                status: 'WAITING',
            });
            await this.seatRepository.save(newSeat);
        }
        if (newSeat.isOccupied) {
            throw new Error('New seat is already occupied');
        }
        const oldTableId = currentSeat.table?.id;
        currentSeat.isOccupied = false;
        currentSeat.player = null;
        currentSeat.playerName = null;
        currentSeat.status = 'WAITING';
        await this.seatRepository.save(currentSeat);
        if (oldTableId) {
            const oldTable = await this.tableRepository.findOne({ where: { id: oldTableId } });
            if (oldTable) {
                oldTable.occupiedSeats = Math.max(0, (oldTable.occupiedSeats ?? 0) - 1);
                if (oldTable.occupiedSeats === 0)
                    oldTable.status = 'INACTIVE';
                await this.tableRepository.save(oldTable);
            }
        }
        // Займи новое место
        const player = await this.playerRepository.findOne({
            where: { id: playerId },
            relations: ['user'],
        });
        if (!player?.user) {
            throw new Error('Player or user not found');
        }
        newSeat.isOccupied = true;
        newSeat.player = player;
        newSeat.playerName = `${player.user.firstName} ${player.user.lastName}`;
        newSeat.status = 'ACTIVE';
        await this.seatRepository.save(newSeat);
        // Обновленный новый стол (занято мест +1)
        const newTableEntity = await this.tableRepository.findOne({
            where: { id: newTableId },
        });
        if (newTableEntity) {
            newTableEntity.occupiedSeats++;
            if (newTableEntity.status === 'INACTIVE')
                newTableEntity.status = 'ACTIVE';
            await this.tableRepository.save(newTableEntity);
        }
        // Вернуть место с загруженной связью table для ответа API
        const result = await this.seatRepository.findOne({
            where: { id: newSeat.id },
            relations: ['table'],
        });
        return result;
    }
    /**
     * Получить все столы турнира с игроками и привязкой к столу клуба
     */
    async getTournamentTables(tournamentId) {
        return await this.tableRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['seats', 'seats.player', 'seats.player.user', 'clubTable'],
            order: {
                tableNumber: 'ASC',
                seats: { seatNumber: 'ASC' },
            },
        });
    }
    /**
     * Получить детали конкретного стола
     */
    async getTableDetails(tableId) {
        const table = await this.tableRepository.findOne({
            where: { id: tableId },
            relations: ['seats', 'seats.player', 'seats.player.user', 'tournament', 'clubTable'],
        });
        if (!table) {
            throw new Error('Table not found');
        }
        return table;
    }
    /**
     * Перемешать массив (Fisher-Yates shuffle)
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    /**
     * Исключить игрока (убрать его со стола)
     */
    async eliminatePlayer(playerId, finishPosition) {
        const seat = await this.seatRepository.findOne({
            where: { player: { id: playerId } },
            relations: ['table'],
        });
        if (!seat) {
            throw new Error('Player seat not found');
        }
        seat.isOccupied = false;
        seat.player = null;
        seat.playerName = null;
        seat.status = 'ELIMINATED';
        await this.seatRepository.save(seat);
        const table = seat.table;
        table.occupiedSeats = Math.max(0, table.occupiedSeats - 1);
        table.status = table.occupiedSeats === 0 ? 'INACTIVE' : 'ACTIVE';
        await this.tableRepository.save(table);
        return seat;
    }
}
exports.SeatingService = SeatingService;
//# sourceMappingURL=SeatingService.js.map