import { AppDataSource } from '../config/database';
import { PlayerProfile } from '../models/PlayerProfile';
import { TournamentResult } from '../models/TournamentResult';
import { Tournament } from '../models/Tournament';

export class StatisticsService {
  private profileRepo = AppDataSource.getRepository(PlayerProfile);
  private resultRepo = AppDataSource.getRepository(TournamentResult);
  private tournamentRepo = AppDataSource.getRepository(Tournament);


  async updatePlayerStatistics(
    userId: string,
    tournamentId: string
  ): Promise<void> {
    // Найти профиль по user_id через связь
    const profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!profile) {
      console.warn(`Profile not found for user ${userId}`);
      return;
    }

    // Найти результат по player_id
    const result = await this.resultRepo
      .createQueryBuilder('result')
      .where('result.player_id = :playerId', { playerId: profile.id })
      .andWhere('result.tournament_id = :tournamentId', { tournamentId })
      .getOne();

    if (!result) {
      console.warn(`Result not found for player ${profile.id} in tournament ${tournamentId}`);
      return;
    }


    // 2. Обновить bestFinish
    if (!profile.bestFinish || result.finishPosition < profile.bestFinish) {
      profile.bestFinish = result.finishPosition;
    }

    // 3. Обновить любимый турнир (наиболее частый)
    profile.favoriteTournamentId = await this.getMostPlayedTournament(profile.id);

    // 4. Обновить streak (серия финишей в призах)
    await this.updateStreak(profile, result);

    // 5. Обновить winRate (процент финальных столов)
    profile.winRate = await this.calculateWinRate(profile.id);

    // 6. Обновить averageFinish
    profile.averageFinish = await this.calculateAverageFinish(profile.id);

    await this.profileRepo.save(profile);
  }


  /**
   * Рассчитать процент финальных столов (winRate)
   */
  private async calculateWinRate(playerProfileId: string): Promise<number> {
    const results = await this.resultRepo
      .createQueryBuilder('result')
      .where('result.player_id = :playerId', { playerId: playerProfileId })
      .getMany();

    if (results.length === 0) return 0;

    const finalTableCount = results.filter((r) => r.isFinalTable).length;
    return parseFloat(((finalTableCount / results.length) * 100).toFixed(2));
  }

  /**
   * Рассчитать среднее место финиша
   */
  private async calculateAverageFinish(playerProfileId: string): Promise<number> {
    const results = await this.resultRepo
      .createQueryBuilder('result')
      .where('result.player_id = :playerId', { playerId: playerProfileId })
      .getMany();

    if (results.length === 0) return 0;

    const totalFinish = results.reduce((sum, r) => sum + r.finishPosition, 0);
    return parseFloat((totalFinish / results.length).toFixed(2));
  }

  /**
   * Получить наиболее часто играемый турнир
   */
  private async getMostPlayedTournament(
    playerProfileId: string
  ): Promise<string | undefined> {
    const result = await this.resultRepo
      .createQueryBuilder('result')
      .select('result.tournament_id', 'tournamentId')
      .addSelect('COUNT(*)', 'count')
      .where('result.player_id = :playerId', { playerId: playerProfileId })
      .groupBy('result.tournament_id')
      .orderBy('count', 'DESC')
      .limit(1)
      .getRawOne();

    return result?.tournamentId;
  }

  /**
   * Обновить серию финишей в призах
   */
  private async updateStreak(
    profile: PlayerProfile,
    result: TournamentResult
  ): Promise<void> {
    // Считаем, что финиш в призах = финальный стол или призовые деньги
    const isInPrizes = result.isFinalTable 

    if (isInPrizes) {
      profile.currentStreak += 1;
      if (profile.currentStreak > profile.bestStreak) {
        profile.bestStreak = profile.currentStreak;
      }
    } else {
      profile.currentStreak = 0;
    }
  }

  /**
   * Получить полную статистику игрока (по playerProfileId)
   */
  async getPlayerFullStatistics(playerProfileId: string): Promise<{
    profile: PlayerProfile | null;
    finishes: {
      first: number;
      second: number;
      third: number;
      others: number;
    };
    participationChart: { month: string; count: number }[];
    lastTournament: Tournament | null;
  }> {
    const profile = await this.profileRepo.findOne({
      where: { id: playerProfileId },
      relations: ['user', 'balance'],
    });

    if (!profile) {
      return {
        profile: null,
        finishes: { first: 0, second: 0, third: 0, others: 0 },
        participationChart: [],
        lastTournament: null,
      };
    }

    const finishes = await this.getFinishStatistics(playerProfileId);
    const participationChart = await this.getParticipationChart(playerProfileId);
    const lastTournament = await this.getLastTournament(playerProfileId);

    return {
      profile,
      finishes,
      participationChart,
      lastTournament,
    };
  }

  /**
   * Получить статистику финишей игрока
   */
  async getFinishStatistics(playerProfileId: string): Promise<{
    first: number;
    second: number;
    third: number;
    others: number;
  }> {
    const results = await this.resultRepo
      .createQueryBuilder('result')
      .where('result.player_id = :playerId', { playerId: playerProfileId })
      .getMany();

    return {
      first: results.filter((r) => r.finishPosition === 1).length,
      second: results.filter((r) => r.finishPosition === 2).length,
      third: results.filter((r) => r.finishPosition === 3).length,
      others: results.filter((r) => r.finishPosition > 3).length,
    };
  }

  /**
   * Получить график участия (по месяцам)
   */
  async getParticipationChart(
    playerProfileId: string
  ): Promise<{ month: string; count: number }[]> {
    const results = await this.resultRepo
      .createQueryBuilder('result')
      .leftJoin('result.tournament', 'tournament')
      .select("TO_CHAR(tournament.startTime, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('result.player_id = :playerId', { playerId: playerProfileId })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      month: r.month,
      count: parseInt(r.count),
    }));
  }

  /**
   * Получить последний сыгранный турнир
   */
  async getLastTournament(playerProfileId: string): Promise<Tournament | null> {
    const result = await this.resultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.tournament', 'tournament')
      .where('result.player_id = :playerId', { playerId: playerProfileId })
      .orderBy('tournament.startTime', 'DESC')
      .getOne();

    return result?.tournament ?? null;
  }
}
