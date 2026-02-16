import { TournamentTable } from '../models/TournamentTable';
import { TableSeat } from '../models/TableSeat';
export declare class SeatingService {
    private tournamentRepository;
    private tableRepository;
    private seatRepository;
    private registrationRepository;
    private playerRepository;
    private readonly maxSeatsPerTable;
    /**
     * Создать столы турнира из столов клуба (один турнирный стол на каждый стол клуба).
     * Столы создаются со статусом INACTIVE (без игроков).
     */
    initializeTablesFromClub(tournamentId: string): Promise<{
        tablesCreated: number;
    }>;
    /**
     * Автоматическая рассадка: рассаживает на пустые места только тех, кто не за столами.
     * Игроки, уже сидящие за столами, остаются на своих местах.
     */
    autoSeating(tournamentId: string): Promise<{
        tablesCreated: number;
        seatsAssigned: number;
    }>;
    /**
     * Ручная пересадка игрока на другой стол/бокс.
     * Можно пересаживать на место, где раньше сидел другой игрок (оно будет свободным).
     */
    manualReseating(tournamentId: string, playerId: string, newTableId: string, newSeatNumber: number): Promise<TableSeat>;
    /**
     * Получить все столы турнира с игроками и привязкой к столу клуба
     */
    getTournamentTables(tournamentId: string): Promise<TournamentTable[]>;
    /**
     * Получить детали конкретного стола
     */
    getTableDetails(tableId: string): Promise<TournamentTable>;
    /**
     * Перемешать массив (Fisher-Yates shuffle)
     */
    private shuffleArray;
    /**
     * Исключить игрока (убрать его со стола)
     */
    eliminatePlayer(playerId: string, finishPosition: number): Promise<TableSeat>;
}
//# sourceMappingURL=SeatingService.d.ts.map