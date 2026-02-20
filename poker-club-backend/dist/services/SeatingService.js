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
     */
    async initializeTablesFromClub(tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: ['club', 'club.tables'],
        });
        if (!tournament)
            throw new Error('Tournament not found');
        if (!tournament.clubId || !tournament.club)
            throw new Error('Tournament has no club');
        const clubTables = tournament.club.tables;
        const tableCount = tournament.club.tableCount ?? 0;
        if (!clubTables?.length && tableCount < 1)
            throw new Error('Club has no tables');
        const existing = await this.tableRepository.count({ where: { tournament: { id: tournamentId } } });
        if (existing > 0)
            return { tablesCreated: 0 };
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
     * Убедиться, что у турнира есть столы.
     * Вызывается при старте турнира (LATE_REG/RUNNING).
     * Если столы уже есть — ничего не делает.
     * Если турнир привязан к клубу — создаёт столы из club.tables.
     * Иначе — создаёт столы по количеству arrived-участников.
     */
    async ensureTournamentTablesExist(tournamentId) {
        const existing = await this.tableRepository.count({ where: { tournament: { id: tournamentId } } });
        if (existing > 0)
            return { tablesCreated: 0 };
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: ['club', 'club.tables'],
        });
        if (!tournament)
            throw new Error('Tournament not found');
        if (tournament.clubId) {
            try {
                return await this.initializeTablesFromClub(tournamentId);
            }
            catch (err) {
                console.warn('Initialize tables from club failed:', err instanceof Error ? err.message : err);
            }
        }
        const regCount = await this.registrationRepository.count({
            where: { tournament: { id: tournamentId }, isActive: true, isArrived: true },
        });
        const n = Math.max(1, Math.ceil(regCount / this.maxSeatsPerTable));
        for (let i = 0; i < n; i++) {
            await this.tableRepository.save(this.tableRepository.create({
                tournament,
                tableNumber: i + 1,
                maxSeats: this.maxSeatsPerTable,
                occupiedSeats: 0,
                status: 'INACTIVE',
            }));
        }
        return { tablesCreated: n };
    }
    /**
     * Авторассадка: только рассаживает игроков.
     * Берёт число участников НЕ за столами. Если их больше чем вмещает один стол —
     * добавляет на второй стол и забирает с первого UTG и дальше (или добровольцев).
     * Равномерно распределяет по столам. При необходимости спрашивает controller (UTG или список игроков).
     */
    async autoSeating(tournamentId, moves) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: ['club', 'club.tables'],
        });
        if (!tournament)
            throw new Error('Tournament not found');
        const registrations = await this.registrationRepository.find({
            where: { tournament: { id: tournamentId }, isActive: true, isArrived: true },
            relations: ['player', 'player.user'],
        });
        if (registrations.length === 0)
            throw new Error('No registrations found');
        let tables = await this.tableRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['clubTable'],
            order: { tableNumber: 'ASC' },
        });
        if (tables.length === 0) {
            await this.ensureTournamentTablesExist(tournamentId);
            tables = await this.tableRepository.find({
                where: { tournament: { id: tournamentId } },
                relations: ['clubTable'],
                order: { tableNumber: 'ASC' },
            });
        }
        const allSeats = await this.seatRepository.find({
            where: { table: { id: (0, typeorm_1.In)(tables.map((t) => t.id)) } },
            relations: ['table', 'player', 'player.user'],
        });
        const seatedPlayerIds = new Set();
        const playersByTable = new Map();
        for (const seat of allSeats) {
            if (seat.isOccupied && seat.player && seat.status !== 'ELIMINATED') {
                seatedPlayerIds.add(seat.player.id);
                if (!playersByTable.has(seat.table.id)) {
                    playersByTable.set(seat.table.id, []);
                }
                playersByTable.get(seat.table.id).push({
                    playerId: seat.player.id,
                    playerName: seat.player.user?.name ?? seat.playerName ?? 'Игрок',
                    seatNumber: seat.seatNumber,
                });
            }
        }
        const unseated = registrations.filter((r) => r.player?.user && !seatedPlayerIds.has(r.player.id));
        const totalPlayers = seatedPlayerIds.size + unseated.length;
        if (totalPlayers === 0)
            return { tablesCreated: 0, seatsAssigned: 0 };
        const maxPerTable = this.maxSeatsPerTable;
        const tablesNeeded = Math.ceil(totalPlayers / maxPerTable);
        while (tables.length < tablesNeeded) {
            const nextNum = tables.length + 1;
            const t = this.tableRepository.create({
                tournament,
                tableNumber: nextNum,
                maxSeats: maxPerTable,
                occupiedSeats: 0,
                status: 'INACTIVE',
            });
            await this.tableRepository.save(t);
            tables.push(t);
        }
        const targetPerTable = Math.ceil(totalPlayers / tablesNeeded);
        const counts = tables.map((t) => {
            const list = playersByTable.get(t.id) ?? [];
            return { table: t, currentCount: list.length, players: list };
        });
        const needToMoveFrom = [];
        for (const { table, currentCount, players } of counts) {
            if (currentCount > targetPerTable) {
                const countToMove = currentCount - targetPerTable;
                needToMoveFrom.push({
                    tableId: table.id,
                    tableNumber: table.tableNumber,
                    countToMove,
                    players: [...players].sort((a, b) => a.seatNumber - b.seatNumber),
                });
            }
        }
        if (needToMoveFrom.length > 0 && !moves?.length) {
            return {
                tablesCreated: 0,
                seatsAssigned: 0,
                needInput: { moves: needToMoveFrom },
            };
        }
        const playersToMoveByTable = new Map();
        if (moves?.length) {
            for (const m of moves) {
                const need = needToMoveFrom.find((n) => n.tableId === m.tableId);
                if (!need)
                    continue;
                let ids;
                if (m.playerIds && m.playerIds.length >= need.countToMove) {
                    ids = m.playerIds.slice(0, need.countToMove);
                }
                else if (m.utgSeatNumber != null) {
                    const sorted = [...need.players].sort((a, b) => a.seatNumber - b.seatNumber);
                    const maxSeat = Math.max(...sorted.map((p) => p.seatNumber));
                    const idx = sorted.findIndex((p) => p.seatNumber === m.utgSeatNumber);
                    const startIdx = idx >= 0 ? idx : 0;
                    ids = [];
                    for (let i = 0; i < need.countToMove; i++) {
                        const p = sorted[(startIdx + i) % sorted.length];
                        ids.push(p.playerId);
                    }
                }
                else {
                    throw new Error(`Missing utgSeatNumber or playerIds for table ${need.tableNumber}`);
                }
                playersToMoveByTable.set(m.tableId, ids);
            }
        }
        for (const [tableId, playerIds] of playersToMoveByTable) {
            for (const playerId of playerIds) {
                const seat = allSeats.find((s) => s.table.id === tableId && s.player?.id === playerId && s.isOccupied);
                if (!seat)
                    continue;
                seat.isOccupied = false;
                seat.player = null;
                seat.playerName = null;
                seat.status = 'WAITING';
                await this.seatRepository.save(seat);
                const tbl = tables.find((t) => t.id === tableId);
                if (tbl) {
                    tbl.occupiedSeats = Math.max(0, (tbl.occupiedSeats ?? 0) - 1);
                    if (tbl.occupiedSeats === 0)
                        tbl.status = 'INACTIVE';
                }
            }
        }
        await this.tableRepository.save(tables);
        const toSeat = [...unseated];
        for (const [, playerIds] of playersToMoveByTable) {
            for (const pid of playerIds) {
                const reg = registrations.find((r) => r.player?.id === pid);
                if (reg && !toSeat.includes(reg))
                    toSeat.push(reg);
            }
        }
        const occupiedByTable = new Map();
        for (const s of allSeats) {
            if (!occupiedByTable.has(s.table.id))
                occupiedByTable.set(s.table.id, new Set());
            if (s.isOccupied)
                occupiedByTable.get(s.table.id).add(s.seatNumber);
        }
        for (const [tableId, playerIds] of playersToMoveByTable) {
            const occupied = occupiedByTable.get(tableId);
            if (occupied) {
                for (const s of allSeats) {
                    if (s.table.id === tableId && s.player && playerIds.includes(s.player.id)) {
                        occupied.delete(s.seatNumber);
                    }
                }
            }
        }
        const emptySlots = [];
        const targetCounts = new Map();
        const remainder = totalPlayers % tablesNeeded;
        for (let i = 0; i < tables.length; i++) {
            const want = i < tablesNeeded
                ? (i < remainder ? Math.ceil(totalPlayers / tablesNeeded) : Math.floor(totalPlayers / tablesNeeded))
                : 0;
            targetCounts.set(tables[i].id, want);
        }
        for (const table of tables) {
            const target = targetCounts.get(table.id) ?? 0;
            const occupied = occupiedByTable.get(table.id) ?? new Set();
            const maxSeats = table.maxSeats ?? maxPerTable;
            for (let n = occupied.size; n < target; n++) {
                for (let sn = 1; sn <= maxSeats; sn++) {
                    if (occupied.has(sn))
                        continue;
                    const existing = allSeats.find((s) => s.table.id === table.id && s.seatNumber === sn);
                    emptySlots.push({
                        table,
                        seatNumber: sn,
                        existingSeat: existing && !existing.isOccupied ? existing : undefined,
                    });
                    occupied.add(sn);
                    break;
                }
            }
        }
        const shuffled = this.shuffleArray(toSeat);
        let assigned = 0;
        for (let i = 0; i < shuffled.length && i < emptySlots.length; i++) {
            const reg = shuffled[i];
            const player = reg.player;
            const slot = emptySlots[i];
            const playerName = player.user.name;
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
     * Ручная пересадка или посадка игрока на стол.
     */
    async manualReseating(tournamentId, playerId, newTableId, newSeatNumber) {
        const currentSeat = await this.seatRepository.findOne({
            where: {
                player: { id: playerId },
                table: { tournament: { id: tournamentId } },
            },
            relations: ['table'],
        });
        let newSeat = await this.seatRepository.findOne({
            where: { table: { id: newTableId }, seatNumber: newSeatNumber },
            relations: ['table'],
        });
        if (!newSeat) {
            const newTable = await this.tableRepository.findOne({
                where: { id: newTableId, tournament: { id: tournamentId } },
            });
            if (!newTable)
                throw new Error('New table not found');
            newSeat = this.seatRepository.create({
                table: newTable,
                seatNumber: newSeatNumber,
                isOccupied: false,
                status: 'WAITING',
            });
            await this.seatRepository.save(newSeat);
        }
        if (newSeat.isOccupied)
            throw new Error('New seat is already occupied');
        const reg = await this.registrationRepository.findOne({
            where: { tournament: { id: tournamentId }, player: { id: playerId } },
        });
        if (!reg)
            throw new Error('Player is not registered');
        if (!reg.isArrived)
            throw new Error('Player has not arrived');
        if (!reg.isActive)
            throw new Error('Player is eliminated');
        if (currentSeat) {
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
        }
        const player = await this.playerRepository.findOne({
            where: { id: playerId },
            relations: ['user'],
        });
        if (!player?.user)
            throw new Error('Player or user not found');
        newSeat.isOccupied = true;
        newSeat.player = player;
        newSeat.playerName = player.user.name;
        newSeat.status = 'ACTIVE';
        await this.seatRepository.save(newSeat);
        const newTableEntity = await this.tableRepository.findOne({ where: { id: newTableId } });
        if (newTableEntity) {
            newTableEntity.occupiedSeats = (newTableEntity.occupiedSeats ?? 0) + 1;
            if (newTableEntity.status === 'INACTIVE')
                newTableEntity.status = 'ACTIVE';
            await this.tableRepository.save(newTableEntity);
        }
        const result = await this.seatRepository.findOne({
            where: { id: newSeat.id },
            relations: ['table'],
        });
        return result;
    }
    async getTournamentTables(tournamentId) {
        return await this.tableRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['seats', 'seats.player', 'seats.player.user', 'clubTable'],
            order: { tableNumber: 'ASC', seats: { seatNumber: 'ASC' } },
        });
    }
    async getTableDetails(tableId) {
        const table = await this.tableRepository.findOne({
            where: { id: tableId },
            relations: ['seats', 'seats.player', 'seats.player.user', 'tournament', 'clubTable'],
        });
        if (!table)
            throw new Error('Table not found');
        return table;
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    async eliminatePlayer(playerId, finishPosition, tournamentId) {
        const where = { player: { id: playerId } };
        if (tournamentId)
            where.table = { tournament: { id: tournamentId } };
        const seat = await this.seatRepository.findOne({
            where: where,
            relations: ['table', 'table.tournament'],
        });
        if (!seat)
            return null;
        seat.isOccupied = false;
        seat.player = null;
        seat.playerName = null;
        seat.status = 'ELIMINATED';
        await this.seatRepository.save(seat);
        const table = seat.table;
        table.occupiedSeats = Math.max(0, (table.occupiedSeats ?? 0) - 1);
        table.status = table.occupiedSeats === 0 ? 'INACTIVE' : 'ACTIVE';
        await this.tableRepository.save(table);
        return seat;
    }
}
exports.SeatingService = SeatingService;
//# sourceMappingURL=SeatingService.js.map