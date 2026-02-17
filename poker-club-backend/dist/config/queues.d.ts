import { Queue, Worker, type Job } from 'bullmq';
export declare const QUEUE_NAMES: {
    readonly TOURNAMENT_JOBS: "tournament-jobs";
};
export type TournamentJobType = {
    type: 'UPDATE_STATS';
    userId: string;
    tournamentId: string;
} | {
    type: 'CHECK_ACHIEVEMENTS';
    userId: string;
    tournamentId: string;
} | {
    type: 'FINISH_TOURNAMENT';
    tournamentId: string;
};
export declare const tournamentQueue: Queue<TournamentJobType, any, string, TournamentJobType, any, string>;
export declare function createTournamentWorker(processor: (job: Job<TournamentJobType>) => Promise<void>): Worker<TournamentJobType>;
//# sourceMappingURL=queues.d.ts.map