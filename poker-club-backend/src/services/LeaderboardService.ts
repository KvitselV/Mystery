import { AppDataSource } from '../config/database';
import { Leaderboard } from '../models/Leaderboard';
import { LeaderboardEntry } from '../models/LeaderboardEntry';
import { TournamentResult } from '../models/TournamentResult';
import { PlayerProfile } from '../models/PlayerProfile';
import { Tournament } from '../models/Tournament';

export class LeaderboardService {
  private leaderboardRepository = AppDataSource.getRepository(Leaderboard);
  private entryRepository = AppDataSource.getRepository(LeaderboardEntry);
  private resultRepository = AppDataSource.getRepository(TournamentResult);
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private playerRepository = AppDataSource.getRepository(PlayerProfile);

  /**
   * Создать или получить рейтинг
   */
  async getOrCreateLeaderboard(
    name: string,
    type: 'TOURNAMENT_SERIES' | 'SEASONAL' | 'RANK_MMR',
    periodStart?: Date,
    periodEnd?: Date,
    seriesId?: string
  ): Promise<Leaderboard> {
    const where: Record<string, unknown> = { type };
    if (seriesId) where.seriesId = seriesId;
    else where.name = name;

    let leaderboard = await this.leaderboardRepository.findOne({
      where: where as never,
    });

    if (!leaderboard) {
      leaderboard = this.leaderboardRepository.create({
        name,
        type,
        periodStart,
        periodEnd,
        seriesId,
      });
      await this.leaderboardRepository.save(leaderboard);
      console.log(`✅ Created leaderboard: ${name} (${type})`);
    }

    return leaderboard;
  }

  /**
   * Получить или создать запись игрока в рейтинге
   */
  async getOrCreateEntry(
    leaderboardId: string,
    playerProfileId: string
  ): Promise<LeaderboardEntry> {
    let entry = await this.entryRepository.findOne({
      where: {
        leaderboard: { id: leaderboardId },
        playerProfile: { id: playerProfileId },
      },
      relations: ['leaderboard', 'playerProfile'],
    });

    if (!entry) {
      const leaderboard = await this.leaderboardRepository.findOne({
        where: { id: leaderboardId },
      });

      const player = await this.playerRepository.findOne({
        where: { id: playerProfileId },
      });

      if (!leaderboard || !player) {
        throw new Error('Leaderboard or player not found');
      }

      entry = this.entryRepository.create({
        leaderboard,
        playerProfile: player,
        rankPosition: 0,
        tournamentsCount: 0,
        averageFinish: 0,
        ratingPoints: 0,
      });

      await this.entryRepository.save(entry);
    }

    return entry;
  }

  /**
   * Обновить запись игрока в рейтинге после турнира
   */
  async updateLeaderboardEntry(
    leaderboardId: string,
    playerProfileId: string,
    finishPosition: number,
    totalPlayers: number,
    points: number
  ): Promise<LeaderboardEntry> {
    const entry = await this.getOrCreateEntry(leaderboardId, playerProfileId);

    // Обновляем статистику
    entry.tournamentsCount += 1;
    
    // Пересчитываем средний финиш
    const totalFinishes = entry.averageFinish * (entry.tournamentsCount - 1) + finishPosition;
    entry.averageFinish = Math.round(totalFinishes / entry.tournamentsCount);
    
    // Добавляем очки
    entry.ratingPoints += points;

    await this.entryRepository.save(entry);

    // Пересчитываем позиции в рейтинге
    await this.recalculateRankPositions(leaderboardId);

    return entry;
  }

  /**
   * Пересчитать позиции в рейтинге
   */
  async recalculateRankPositions(leaderboardId: string): Promise<void> {
    const entries = await this.entryRepository.find({
      where: { leaderboard: { id: leaderboardId } },
      order: { ratingPoints: 'DESC' },
    });

    for (let i = 0; i < entries.length; i++) {
      entries[i].rankPosition = i + 1;
    }

    await this.entryRepository.save(entries);
  }

  /**
   * Получить записи рейтинга
   */
  async getLeaderboardEntries(
    leaderboardId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<LeaderboardEntry[]> {
    return this.entryRepository.find({
      where: { leaderboard: { id: leaderboardId } },
      relations: ['playerProfile', 'playerProfile.user'],
      order: { rankPosition: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Получить все рейтинги
   */
  async getAllLeaderboards(): Promise<Leaderboard[]> {
    return this.leaderboardRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Создать сезонный рейтинг для текущего месяца
   */
  async createSeasonalLeaderboard(): Promise<Leaderboard> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const name = `Seasonal ${periodStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`;

    return this.getOrCreateLeaderboard(
      name,
      'SEASONAL',
      periodStart,
      periodEnd
    );
  }

  /**
   * Создать рейтинг по ММР
   */
  async createRankMMRLeaderboard(): Promise<Leaderboard> {
    return this.getOrCreateLeaderboard('Rank MMR Leaderboard', 'RANK_MMR');
  }

  /**
   * Обновить рейтинг по ММР
   */
  async updateRankMMRLeaderboard(): Promise<void> {
    const leaderboard = await this.createRankMMRLeaderboard();

    // Получить всех игроков, отсортированных по ММР
    const players = await this.playerRepository.find({
      order: { mmrValue: 'DESC' },
    });

    // Очистить старые записи
    await this.entryRepository.delete({ leaderboard: { id: leaderboard.id } });

    // Создать новые записи
    for (let i = 0; i < players.length; i++) {
      const player = players[i];

      const entry = this.entryRepository.create({
        leaderboard,
        playerProfile: player,
        rankPosition: i + 1,
        tournamentsCount: 0, // Можно посчитать реально
        averageFinish: 0,
        ratingPoints: player.mmrValue,
      });

      await this.entryRepository.save(entry);
    }

    console.log(`✅ Updated Rank MMR Leaderboard with ${players.length} players`);
  }

  /**
   * Обновить все релевантные рейтинги после завершения турнира
   */
  async updateLeaderboardsAfterTournament(tournamentId: string): Promise<void> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['registrations', 'series'],
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const results = await this.resultRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: ['player'],
    });

    const totalPlayers = tournament.registrations.length;

    // Сохраняем очки в TournamentResult и обновляем рейтинги
    for (const result of results) {
      const points = this.calculatePoints(result.finishPosition, totalPlayers);
      result.points = points;
      await this.resultRepository.save(result);
    }

    // 1. Обновить рейтинг серии (если турнир в серии)
    if (tournament.series?.id) {
      const seriesLb = await this.getOrCreateLeaderboard(
        tournament.series.name,
        'TOURNAMENT_SERIES',
        tournament.series.periodStart,
        tournament.series.periodEnd,
        tournament.series.id
      );
      for (const result of results) {
        await this.updateLeaderboardEntry(
          seriesLb.id,
          result.player.id,
          result.finishPosition,
          totalPlayers,
          result.points
        );
      }
    }

    // 2. Обновить сезонный рейтинг
    const seasonalLeaderboard = await this.createSeasonalLeaderboard();
    for (const result of results) {
      await this.updateLeaderboardEntry(
        seasonalLeaderboard.id,
        result.player.id,
        result.finishPosition,
        totalPlayers,
        result.points
      );
    }

    // 3. Обновить рейтинг по ММР
    await this.updateRankMMRLeaderboard();

    console.log(`✅ Updated leaderboards after tournament ${tournamentId}`);
  }

  /**
   * Рассчитать очки за финиш
   */
  private calculatePoints(finishPosition: number, totalPlayers: number): number {
    let points = 0;

    if (finishPosition === 1) {
      points = 100;
    } else if (finishPosition === 2) {
      points = 70;
    } else if (finishPosition === 3) {
      points = 50;
    } else if (finishPosition <= 5) {
      points = 30;
    } else if (finishPosition <= 9) {
      points = 20;
    } else {
      points = 10;
    }

    // Коэффициент за размер турнира
    if (totalPlayers >= 50) {
      points = Math.floor(points * 1.5);
    } else if (totalPlayers >= 30) {
      points = Math.floor(points * 1.2);
    }

    return points;
  }
}
