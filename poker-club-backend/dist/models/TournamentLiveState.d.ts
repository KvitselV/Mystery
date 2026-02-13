import { Tournament } from './Tournament';
export declare class TournamentLiveState {
    id: string;
    tournament: Tournament;
    currentLevelNumber: number;
    levelRemainingTimeSeconds: number;
    playersCount: number;
    totalParticipants: number;
    totalEntries: number;
    totalChipsInPlay: number;
    averageStack: number;
    isPaused: boolean;
    nextBreakTime?: Date;
    liveStatus: string;
    updatedAt: Date;
}
//# sourceMappingURL=TournamentLiveState.d.ts.map