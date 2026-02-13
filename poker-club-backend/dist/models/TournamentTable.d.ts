import { Tournament } from './Tournament';
import { TableSeat } from './TableSeat';
import { ClubTable } from './ClubTable';
export declare class TournamentTable {
    id: string;
    tournament: Tournament;
    clubTableId: string | null;
    clubTable: ClubTable | null;
    tableNumber: number;
    maxSeats: number;
    occupiedSeats: number;
    status: string;
    seats: TableSeat[];
    createdAt: Date;
}
//# sourceMappingURL=TournamentTable.d.ts.map