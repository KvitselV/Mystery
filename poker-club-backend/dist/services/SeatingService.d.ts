import { TournamentTable } from '../models/TournamentTable';
import { TableSeat } from '../models/TableSeat';
export interface AutoSeatingMoveInput {
    tableId: string;
    utgSeatNumber?: number;
    playerIds?: string[];
}
export interface NeedInputTable {
    tableId: string;
    tableNumber: number;
    countToMove: number;
    players: {
        playerId: string;
        playerName: string;
        seatNumber: number;
    }[];
}
export interface AutoSeatingResult {
    tablesCreated: number;
    seatsAssigned: number;
    needInput?: {
        moves: NeedInputTable[];
    };
}
export declare class SeatingService {
    private tournamentRepository;
    private tableRepository;
    private seatRepository;
    private registrationRepository;
    private playerRepository;
    private readonly maxSeatsPerTable;
    /**
     * Создать столы турнира из столов клуба (один турнирный стол на каждый стол клуба).
     */
    initializeTablesFromClub(tournamentId: string): Promise<{
        tablesCreated: number;
    }>;
    /**
     * Убедиться, что у турнира есть столы.
     * Вызывается при старте турнира (LATE_REG/RUNNING).
     * Если столы уже есть — ничего не делает.
     * Если турнир привязан к клубу — создаёт столы из club.tables.
     * Иначе — создаёт столы по количеству arrived-участников.
     */
    ensureTournamentTablesExist(tournamentId: string): Promise<{
        tablesCreated: number;
    }>;
    /**
     * Авторассадка: только рассаживает игроков.
     * Берёт число участников НЕ за столами. Если их больше чем вмещает один стол —
     * добавляет на второй стол и забирает с первого UTG и дальше (или добровольцев).
     * Равномерно распределяет по столам. При необходимости спрашивает controller (UTG или список игроков).
     */
    autoSeating(tournamentId: string, moves?: AutoSeatingMoveInput[]): Promise<AutoSeatingResult>;
    /**
     * Ручная пересадка или посадка игрока на стол.
     */
    manualReseating(tournamentId: string, playerId: string, newTableId: string, newSeatNumber: number): Promise<TableSeat>;
    getTournamentTables(tournamentId: string): Promise<TournamentTable[]>;
    getTableDetails(tableId: string): Promise<TournamentTable>;
    private shuffleArray;
    eliminatePlayer(playerId: string, finishPosition: number, tournamentId?: string): Promise<TableSeat | null>;
}
//# sourceMappingURL=SeatingService.d.ts.map