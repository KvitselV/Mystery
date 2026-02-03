import { TournamentSeries } from './TournamentSeries';
import { TournamentTable } from './TournamentTable';
import { TournamentRegistration } from './TournamentRegistration';
export declare class Tournament {
    id: string;
    name: string;
    startTime: Date;
    status: string;
    buyInAmount: number;
    startingStack: number;
    currentLevelNumber: number;
    blindStructureId: string;
    series: TournamentSeries;
    tables: TournamentTable[];
    registrations: TournamentRegistration[];
}
//# sourceMappingURL=Tournament.d.ts.map