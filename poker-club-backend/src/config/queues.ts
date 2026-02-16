import { Queue, Worker, type Job, type ConnectionOptions } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const QUEUE_NAMES = {
  TOURNAMENT_JOBS: 'tournament-jobs',
} as const;

export type TournamentJobType =
  | { type: 'UPDATE_STATS'; userId: string; tournamentId: string }
  | { type: 'CHECK_ACHIEVEMENTS'; userId: string; tournamentId: string }
  | { type: 'FINISH_TOURNAMENT'; tournamentId: string };

export const tournamentQueue = new Queue<TournamentJobType>(QUEUE_NAMES.TOURNAMENT_JOBS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
  },
});

export function createTournamentWorker(
  processor: (job: Job<TournamentJobType>) => Promise<void>
): Worker<TournamentJobType> {
  return new Worker<TournamentJobType>(QUEUE_NAMES.TOURNAMENT_JOBS, processor, {
    connection: redisConnection,
    concurrency: 2,
  });
}
