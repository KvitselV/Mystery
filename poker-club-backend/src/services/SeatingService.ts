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

  /**
   * Автоматическая рассадка игроков
   * 
   * Алгоритм:
   * 1. Получить всех зарегистрированных игроков
   * 2. Создать столы (максимум 9 мест за столом)
   * 3. Распределить игроков равномерно по столам
   * 4. Рандомизировать боксы (позиции за столом)
   */
  async autoSeating(tournamentId: string): Promise<{
    tablesCreated: number;
    seatsAssigned: number;
  }> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['registrations', 'registrations.player', 'registrations.player.user'],
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (!tournament.registrations) {
      throw new Error('No registrations found');
    }

    const playerCount = tournament.registrations.length;
    const maxSeatsPerTable = 9;
    const tableCount = Math.ceil(playerCount / maxSeatsPerTable);

    // Удали старые столы и боксы (если есть)
    await this.tableRepository.delete({ tournament: { id: tournamentId } });

    // Создай новые столы
    const tables: TournamentTable[] = [];
    for (let i = 0; i < tableCount; i++) {
      const table = this.tableRepository.create({
        tournament,
        tableNumber: i + 1,
        maxSeats: maxSeatsPerTable,
        status: 'AVAILABLE',
      });
      tables.push(table);
    }

    await this.tableRepository.save(tables);

    // Перемешай игроков для случайности
    const shuffledRegistrations = this.shuffleArray(tournament.registrations);

    // Распредели игроков по столам и боксам
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

      // Если стол заполнен, перейди на следующий
      if (seatIndex >= maxSeatsPerTable) {
        table.occupiedSeats = seatIndex;
        seatIndex = 0;
        tableIndex++;
      }
    }

    // Сохрани последний стол
    if (seatIndex > 0 && tableIndex < tables.length) {
      tables[tableIndex].occupiedSeats = seatIndex;
    }

    await this.tableRepository.save(tables);
    await this.seatRepository.save(allSeats);

    return {
      tablesCreated: tableCount,
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

    // Обновленное старый стол (занято мест -1)
    const oldTable = currentSeat.table;
    oldTable.occupiedSeats = Math.max(0, oldTable.occupiedSeats - 1);
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
      await this.tableRepository.save(newTableEntity);
    }

    return newSeat;
  }

  /**
   * Получить все столы турнира с игроками
   */
  async getTournamentTables(tournamentId: string): Promise<TournamentTable[]> {
    return await this.tableRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: ['seats', 'seats.player', 'seats.player.user'],
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
      relations: ['seats', 'seats.player', 'seats.player.user', 'tournament'],
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

    // Обновненный стол (занято мест -1)
    const table = seat.table;
    table.occupiedSeats = Math.max(0, table.occupiedSeats - 1);
    await this.tableRepository.save(table);

    return seat;
  }
}
