import { TournamentLevel } from './TournamentLevel';
import { Club } from './Club';
export declare class BlindStructure {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    clubId: string | null;
    club: Club | null;
    levels: TournamentLevel[];
    createdAt: Date;
}
//# sourceMappingURL=BlindStructure.d.ts.map