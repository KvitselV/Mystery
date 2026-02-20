import { Job } from 'bullmq';
import { createTournamentWorker, type TournamentJobType } from '../config/queues';
import { StatisticsService } from '../services/StatisticsService';
import { AchievementService } from '../services/AchievementService';
import { MMRService } from '../services/MMRService';
import { LeaderboardService } from '../services/LeaderboardService';
import { LiveTournamentService } from '../services/LiveTournamentService';

const statisticsService = StatisticsService.getInstance();
const achievementService = new AchievementService();
const mmrService = new MMRService();
const leaderboardService = new LeaderboardService();
const liveTournamentService = new LiveTournamentService();

async function processJob(job: Job<TournamentJobType>) {
  const { data } = job;

  switch (data.type) {
    case 'UPDATE_STATS':
      await statisticsService.updatePlayerStatistics(data.userId, data.tournamentId);
      break;

    case 'CHECK_ACHIEVEMENTS':
      const granted = await achievementService.checkAndGrantAchievements(
        data.userId,
        data.tournamentId
      );
      if (granted.length > 0) {
        console.log(
          `🏆 Player ${data.userId} earned ${granted.length} achievement(s):`,
          granted.map((a) => a.achievementType?.code || 'unknown')
        );
      }
      break;

    case 'FINISH_TOURNAMENT':
      await liveTournamentService.processFinishTournamentJobs(data.tournamentId);
      break;

    default:
      console.warn('Unknown job type:', (data as { type: string }).type);
  }
}

export function startTournamentWorker() {
  const worker = createTournamentWorker(processJob);

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed: ${(job.data as TournamentJobType).type}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  console.log('📦 Tournament worker started');
  return worker;
}
