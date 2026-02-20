import { AppDataSource } from '../../config/database';
import { TournamentResult } from '../../models/TournamentResult';
import { PlayerProfile } from '../../models/PlayerProfile';
import { UniversalStatisticsService } from './UniversalStatisticsService';
import {
  createCountCalculator,
  createAverageCalculator,
  createPercentageCalculator,
  createMinCalculator,
  createGroupByCalculator,
  createTimeSeriesCalculator,
} from './calculators/BaseCalculators';
import {
  StatisticsContext,
  StatisticsResult,
} from './types';

export type PokerMetricName =
  | 'tournamentsPlayed'
  | 'wins'
  | 'secondPlaces'
  | 'thirdPlaces'
  | 'averageFinish'
  | 'bestFinish'
  | 'finalTableRate'
  | 'winRate'
  | 'participationByMonth'
  | 'tournamentDistribution'
  | 'finalTableCount'
  | 'seriesWins';

export const POKER_METRIC_NAMES: PokerMetricName[] = [
  'tournamentsPlayed',
  'wins',
  'secondPlaces',
  'thirdPlaces',
  'averageFinish',
  'bestFinish',
  'finalTableRate',
  'winRate',
  'participationByMonth',
  'tournamentDistribution',
  'finalTableCount',
  'seriesWins',
];

function createPokerFetchData(): (context: StatisticsContext) => Promise<TournamentResult[]> {
  const resultRepo = AppDataSource.getRepository(TournamentResult);

  return async (context: StatisticsContext): Promise<TournamentResult[]> => {
    const qb = resultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.tournament', 'tournament')
      .leftJoinAndSelect('tournament.series', 'series')
      .leftJoinAndSelect('result.player', 'player');

    const playerProfileId = context.entityId ?? context.filters?.playerProfileId as string | undefined;
    if (playerProfileId) {
      qb.andWhere('result.player_id = :playerProfileId', { playerProfileId });
    }

    if (context.timeRange) {
      qb.andWhere('tournament.startTime >= :from', { from: context.timeRange.from });
      qb.andWhere('tournament.startTime <= :to', { to: context.timeRange.to });
    }

    return qb.getMany();
  };
}

function createPokerCalculators() {
  return [
    createCountCalculator<TournamentResult>('tournamentsPlayed'),
    createCountCalculator<TournamentResult>('wins', (r) => r.finishPosition === 1),
    createCountCalculator<TournamentResult>('secondPlaces', (r) => r.finishPosition === 2),
    createCountCalculator<TournamentResult>('thirdPlaces', (r) => r.finishPosition === 3),
    createAverageCalculator<TournamentResult>(
      'averageFinish',
      (r) => r.finishPosition
    ),
    createMinCalculator<TournamentResult>(
      'bestFinish',
      (r) => r.finishPosition
    ),
    createPercentageCalculator<TournamentResult>(
      'finalTableRate',
      (r) => r.isFinalTable
    ),
    /** winRate = процент побед (1-е место). Для % финальных столов см. finalTableRate */
    createPercentageCalculator<TournamentResult>(
      'winRate',
      (r) => r.finishPosition === 1
    ),
    createTimeSeriesCalculator<TournamentResult>(
      'participationByMonth',
      (r) => r.tournament?.startTime ?? null,
      'month'
    ),
    createGroupByCalculator<TournamentResult>(
      'tournamentDistribution',
      (r) => r.tournament?.name ?? '(unknown)'
    ),
    createCountCalculator<TournamentResult>('finalTableCount', (r) => r.isFinalTable),
    createCountCalculator<TournamentResult>(
      'seriesWins',
      (r) => r.finishPosition === 1 && r.tournament?.series != null
    ),
  ];
}

export class PokerStatisticsService {
  private static instance: PokerStatisticsService | null = null;

  private universalService: UniversalStatisticsService<TournamentResult>;
  private profileRepo = AppDataSource.getRepository(PlayerProfile);

  static getInstance(): PokerStatisticsService {
    if (!PokerStatisticsService.instance) {
      PokerStatisticsService.instance = new PokerStatisticsService();
    }
    return PokerStatisticsService.instance;
  }

  constructor() {
    this.universalService = new UniversalStatisticsService<TournamentResult>(
      'TournamentResult',
      createPokerFetchData()
    );
    this.universalService.registerCalculators(createPokerCalculators());
  }

  private resolvePlayerProfileId(userId: string): Promise<string | null> {
    return this.profileRepo
      .findOne({
        where: { user: { id: userId } },
        select: ['id'],
      })
      .then((p) => p?.id ?? null);
  }

  /**
   * Получить статистику игрока по userId
   */
  async getPlayerStatistics(
    userId: string,
    timeRange?: { from: Date; to: Date },
    requestedMetrics?: string[]
  ): Promise<StatisticsResult | null> {
    const playerProfileId = await this.resolvePlayerProfileId(userId);
    if (!playerProfileId) return null;

    const context: StatisticsContext = {
      userId,
      entityId: playerProfileId,
      timeRange,
      filters: { playerProfileId },
    };

    return this.universalService.calculateStatistics(context, requestedMetrics);
  }

  /**
   * Получить статистику игрока по playerProfileId
   */
  async getPlayerStatisticsByProfileId(
    playerProfileId: string,
    timeRange?: { from: Date; to: Date },
    requestedMetrics?: string[]
  ): Promise<StatisticsResult> {
    const context: StatisticsContext = {
      entityId: playerProfileId,
      timeRange,
      filters: { playerProfileId },
    };

    return this.universalService.calculateStatistics(context, requestedMetrics);
  }

  /**
   * Сравнить статистику нескольких игроков
   */
  async comparePlayerStatistics(
    userIds: string[],
    requestedMetrics?: string[]
  ): Promise<Map<string, StatisticsResult | null>> {
    const profileIds = await Promise.all(
      userIds.map((uid) => this.resolvePlayerProfileId(uid))
    );

    const results = new Map<string, StatisticsResult | null>();
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const profileId = profileIds[i];
      if (!profileId) {
        results.set(userId, null);
        continue;
      }
      const context: StatisticsContext = {
        userId,
        entityId: profileId,
        filters: { playerProfileId: profileId },
      };
      const result = await this.universalService.calculateStatistics(
        context,
        requestedMetrics
      );
      results.set(userId, result);
    }
    return results;
  }

  getAvailableMetrics(): string[] {
    return this.universalService.getRegisteredMetrics();
  }
}
