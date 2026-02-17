"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentQueue = exports.QUEUE_NAMES = void 0;
exports.createTournamentWorker = createTournamentWorker;
const bullmq_1 = require("bullmq");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
};
exports.QUEUE_NAMES = {
    TOURNAMENT_JOBS: 'tournament-jobs',
};
exports.tournamentQueue = new bullmq_1.Queue(exports.QUEUE_NAMES.TOURNAMENT_JOBS, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 1000 },
    },
});
function createTournamentWorker(processor) {
    return new bullmq_1.Worker(exports.QUEUE_NAMES.TOURNAMENT_JOBS, processor, {
        connection: redisConnection,
        concurrency: 2,
    });
}
//# sourceMappingURL=queues.js.map