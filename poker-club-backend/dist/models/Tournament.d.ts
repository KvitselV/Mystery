import { TournamentSeries } from './TournamentSeries';
import { TournamentTable } from './TournamentTable';
import { TournamentRegistration } from './TournamentRegistration';
import { TournamentReward } from './TournamentReward';
import { BlindStructure } from './BlindStructure';
import { Club } from './Club';
export declare class Tournament {
    id: string;
    name: string;
    startTime: Date;
    status: string;
    buyInCost: number;
    startingStack: number;
    addonChips: number;
    addonCost: number;
    rebuyChips: number;
    rebuyCost: number;
    maxRebuys: number;
    maxAddons: number;
    currentLevelNumber: number;
    blindStructureId: string;
    blindStructure?: BlindStructure;
    series: TournamentSeries;
    clubId: string;
    club: Club;
    tables: TournamentTable[];
    registrations: TournamentRegistration[];
    rewards: TournamentReward[];
}
//# sourceMappingURL=Tournament.d.ts.map