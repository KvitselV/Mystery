"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTournamentWorker = startTournamentWorker;
const queues_1 = require("../config/queues");
const StatisticsService_1 = require("../services/StatisticsService");
const AchievementService_1 = require("../services/AchievementService");
const MMRService_1 = require("../services/MMRService");
const LeaderboardService_1 = require("../services/LeaderboardService");
const LiveTournamentService_1 = require("../services/LiveTournamentService");
const statisticsService = new StatisticsService_1.StatisticsService();
const achievementService = new AchievementService_1.AchievementService();
const mmrService = new MMRService_1.MMRService();
const leaderboardService = new LeaderboardService_1.LeaderboardService();
const liveTournamentService = new LiveTournamentService_1.LiveTournamentService();
async function processJob(job) {
    const { data } = job;
    switch (data.type) {
        case 'UPDATE_STATS':
            await statisticsService.updatePlayerStatistics(data.userId, data.tournamentId);
            break;
        case 'CHECK_ACHIEVEMENTS':
            const granted = await achievementService.checkAndGrantAchievements(data.userId, data.tournamentId);
            if (granted.length > 0) {
                console.log(`🏆 Player ${data.userId} earned ${granted.length} achievement(s):`, granted.map((a) => a.achievementType?.code || 'unknown'));
            }
            break;
        case 'FINISH_TOURNAMENT':
            await liveTournamentService.processFinishTournamentJobs(data.tournamentId);
            break;
        default:
            console.warn('Unknown job type:', data.type);
    }
}
function startTournamentWorker() {
    const worker = (0, queues_1.createTournamentWorker)(processJob);
    worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed: ${job.data.type}`);
    });
    worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
    });
    console.log('📦 Tournament worker started');
    return worker;
}
//# sourceMappingURL=tournamentWorker.js.map