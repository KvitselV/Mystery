import { TournamentTable } from './TournamentTable';
import { PlayerProfile } from './PlayerProfile';
export declare class TableSeat {
    id: string;
    table: TournamentTable;
    seatNumber: number;
    player: PlayerProfile | null;
    playerName: string | null;
    isOccupied: boolean;
    status: string;
    createdAt: Date;
}
//# sourceMappingURL=TableSeat.d.ts.map