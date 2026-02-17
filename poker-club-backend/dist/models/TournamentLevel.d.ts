import { BlindStructure } from './BlindStructure';
export declare class TournamentLevel {
    id: string;
    blindStructure: BlindStructure;
    levelNumber: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    durationMinutes: number;
    isBreak: boolean;
    breakName?: string;
    /** Тип перерыва: REGULAR | END_LATE_REG | ADDON | END_LATE_REG_AND_ADDON */
    breakType?: string;
}
//# sourceMappingURL=TournamentLevel.d.ts.map