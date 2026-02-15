import { AppDataSource } from '../config/database';
import { Tournament } from '../models/Tournament';
import { TournamentTable } from '../models/TournamentTable';
import { TableSeat } from '../models/TableSeat';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { PlayerProfile } from '../models/PlayerProfile';

export class SeatingService {
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private tableRepository = AppDataSource.getRepository(TournamentTable);
  private seatRepository = AppDataSource.getRepository(TableSeat);
  private registrationRepository = AppDataSource.getRepository(TournamentRegistration);
  private playerRepository = AppDataSource.getRepository(PlayerProfile);

  private readonly maxSeatsPerTable = 9;

  /**
   * Создать столы турнира из столов клуба (один турнирный стол на каждый стол клуба).
   * Столы создаются со статусом INACTIVE (без игроков).
   */
  async initializeTablesFromClub(tournamentId: string): Promise<{ tablesCreated: number }> {
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
    if (!clubTables?.length) {
      throw new Error('Club has no tables');
    }

    // Не создавать повторно, если столы уже есть
    const existing = await this.tableRepository.count({
      where: { tournament: { id: tournamentId } },
    });
    if (existing > 0) {
      return { tablesCreated: 0 };
    }

    const tables: TournamentTable[] = clubTables
      .sort((a, b) => a.tableNumber - b.tableNumber)
      .map((clubTable) =>
        this.tableRepository.create({
          tournament,
          clubTable,
          clubTableId: clubTable.id,
          tableNumber: clubTable.tableNumber,
          maxSeats: clubTable.maxSeats ?? this.maxSeatsPerTable,
          occupiedSeats: 0,
          status: 'INACTIVE',
        })
      );

    await this.tableRepository.save(tables);
    return { tablesCreated: tables.length };
  }

  /**
   * Автоматическая рассадка игроков.
   * Если турнир привязан к клубу — используются столы клуба (создаются при первом вызове при необходимости).
   * Столы без игроков остаются INACTIVE, с игроками — ACTIVE.
   */
  async autoSeating(tournamentId: string): Promise<{
    tablesCreated: number;
    seatsAssigned: number;
  }> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['club', 'club.tables', 'registrations', 'registrations.player', 'registrations.player.user'],
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (!tournament.registrations?.length) {
      throw new Error('No registrations found');
    }

    const playerCount = tournament.registrations.length;
    let tables: TournamentTable[];

    if (tournament.clubId && tournament.club?.tables?.length) {
      // Турнир в клубе: столы из клуба
      let existingTables = await this.tableRepository.find({
        where: { tournament: { id: tournamentId } },
        relations: ['clubTable'],
        order: { tableNumber: 'ASC' },
      });

      if (existingTables.length === 0) {
        await this.initializeTablesFromClub(tournamentId);
        existingTables = await this.tableRepository.find({
          where: { tournament: { id: tournamentId } },
          relations: ['clubTable'],
          order: { tableNumber: 'ASC' },
        });
      }

      // Удалить старые места (игроков), рассадка заново
      const tableIds = existingTables.map((t) => t.id);
      if (tableIds.length > 0) {
        await this.seatRepository
          .createQueryBuilder()
          .delete()
          .where('table_id IN (:...tableIds)', { tableIds })
          .execute();
      }

      tables = existingTables;
      // Сбросить занятость по всем столам
      for (const t of tables) {
        t.occupiedSeats = 0;
        t.status = 'INACTIVE';
      }
      await this.tableRepository.save(tables);
    } else {
      // Турнир без клуба: создаём столы по количеству игроков
      const existingTableIds = (
        await this.tableRepository.find({ where: { tournament: { id: tournamentId } }, select: ['id'] })
      ).map((t) => t.id);
      if (existingTableIds.length > 0) {
        await this.seatRepository
          .createQueryBuilder()
          .delete()
          .where('table_id IN (:...ids)', { ids: existingTableIds })
          .execute();
      }
      await this.tableRepository
        .createQueryBuilder()
        .delete()
        .where('tournament_id = :tid', { tid: tournamentId })
        .execute();
      const tableCount = Math.ceil(playerCount / this.maxSeatsPerTable);
      tables = [];
      for (let i = 0; i < tableCount; i++) {
        const table = this.tableRepository.create({
          tournament,
          tableNumber: i + 1,
          maxSeats: this.maxSeatsPerTable,
          occupiedSeats: 0,
          status: 'INACTIVE',
        });
        tables.push(table);
      }
      await this.tableRepository.save(tables);
    }

    const shuffledRegistrations = this.shuffleArray(tournament.registrations);
    let tableIndex = 0;
    let seatIndex = 0;
    const allSeats: TableSeat[] = [];

    for (const registration of shuffledRegistrations) {
      const table = tables[tableIndex];
      const player = registration.player;

      const seat = this.seatRepository.create({
        table,
        seatNumber: seatIndex + 1,
        player,
        playerName: `${player.user.firstName} ${player.user.lastName}`,
        isOccupied: true,
        status: 'ACTIVE',
      });

      allSeats.push(seat);
      seatIndex++;

      if (seatIndex >= table.maxSeats) {
        table.occupiedSeats = seatIndex;
        table.status = 'ACTIVE';
        seatIndex = 0;
        tableIndex++;
      }
    }

    if (seatIndex > 0 && tableIndex < tables.length) {
      tables[tableIndex].occupiedSeats = seatIndex;
      tables[tableIndex].status = 'ACTIVE';
    }

    await this.tableRepository.save(tables);
    await this.seatRepository.save(allSeats);

    return {
      tablesCreated: tournament.clubId ? 0 : tables.length,
      seatsAssigned: playerCount,
    };
  }

  /**
   * Ручная пересадка игрока на другой стол/бокс
   */
  async manualReseating(
    playerId: string,
    newTableId: string,
    newSeatNumber: number
  ): Promise<TableSeat> {
    // Найди текущее место игрока
    const currentSeat = await this.seatRepository.findOne({
      where: { player: { id: playerId } },
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
    });

    // Если бокс не существует - создай его
    if (!newSeat) {
      const newTable = await this.tableRepository.findOne({
        where: { id: newTableId },
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

    // Освободи старое место
    currentSeat.isOccupied = false;
    currentSeat.player = null;
    currentSeat.playerName = null;
    currentSeat.status = 'WAITING';
    await this.seatRepository.save(currentSeat);

    const oldTable = currentSeat.table;
    oldTable.occupiedSeats = Math.max(0, oldTable.occupiedSeats - 1);
    if (oldTable.occupiedSeats === 0) oldTable.status = 'INACTIVE';
    await this.tableRepository.save(oldTable);

    // Займи новое место
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ['user'],
    });

    newSeat.isOccupied = true;
    newSeat.player = player!;
    newSeat.playerName = `${player!.user.firstName} ${player!.user.lastName}`;
    newSeat.status = 'ACTIVE';
    await this.seatRepository.save(newSeat);

    // Обновленный новый стол (занято мест +1)
    const newTableEntity = await this.tableRepository.findOne({
      where: { id: newTableId },
    });

    if (newTableEntity) {
      newTableEntity.occupiedSeats++;
      if (newTableEntity.status === 'INACTIVE') newTableEntity.status = 'ACTIVE';
      await this.tableRepository.save(newTableEntity);
    }

    return newSeat;
  }

  /**
   * Получить все столы турнира с игроками и привязкой к столу клуба
   */
  async getTournamentTables(tournamentId: string): Promise<TournamentTable[]> {
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
  async getTableDetails(tableId: string): Promise<TournamentTable> {
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
  private shuffleArray<T>(array: T[]): T[] {
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
  async eliminatePlayer(playerId: string, finishPosition: number): Promise<TableSeat> {
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
