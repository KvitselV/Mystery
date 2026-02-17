import { In, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import { TournamentSeries } from '../models/TournamentSeries';
import { TournamentResult } from '../models/TournamentResult';
import { Tournament } from '../models/Tournament';
import { LeaderboardService } from './LeaderboardService';
import { TournamentService } from './TournamentService';

export class TournamentSeriesService {
  private seriesRepository = AppDataSource.getRepository(TournamentSeries);
  private leaderboardService = new LeaderboardService();
  private tournamentService = new TournamentService();

  async createSeries(data: {
    name: string;
    periodStart: Date;
    periodEnd: Date;
    daysOfWeek?: number[];
    clubId: string | null;
    defaultStartTime?: string;
    defaultBuyIn?: number;
    defaultStartingStack?: number;
    defaultBlindStructureId?: string;
    defaultAddonChips?: number;
    defaultAddonCost?: number;
    defaultRebuyChips?: number;
    defaultRebuyCost?: number;
    defaultMaxRebuys?: number;
    defaultMaxAddons?: number;
  }): Promise<TournamentSeries> {
    const clubId = data.clubId;
    if (!clubId) throw new Error('clubId is required');
    const daysStr = data.daysOfWeek?.length
      ? data.daysOfWeek.sort((a, b) => a - b).join(',')
      : '1,2,3,4,5,6';

    const series = this.seriesRepository.create({
      name: data.name,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      daysOfWeek: daysStr,
      clubId,
    });

    const saved = await this.seriesRepository.save(series);

    await this.leaderboardService.getOrCreateLeaderboard(
      data.name,
      'TOURNAMENT_SERIES',
      data.periodStart,
      data.periodEnd,
      saved.id
    );

    // Автосоздание турниров от первого дня до финального по daysOfWeek
    const daysOfWeekArr = daysStr.split(',').map((s) => parseInt(s, 10));
    const startTimeStr = data.defaultStartTime || '19:00';
    const [hh, mm] = startTimeStr.split(':').map((s) => parseInt(s, 10) || 0);
    const buyIn = data.defaultBuyIn ?? 3000;
    const startingStack = data.defaultStartingStack ?? 10000;

    const start = new Date(data.periodStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(data.periodEnd);
    end.setHours(23, 59, 59, 999);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (!daysOfWeekArr.includes(dayOfWeek)) continue;

      const startTime = new Date(d);
      startTime.setHours(hh, mm, 0, 0);

      const nameSuffix = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const tournamentName = `${data.name} - ${nameSuffix}`;

      await this.tournamentService.createTournament({
        name: tournamentName,
        seriesId: saved.id,
        clubId,
        startTime,
        buyInCost: buyIn,
        startingStack,
        blindStructureId: data.defaultBlindStructureId,
        addonChips: data.defaultAddonChips ?? 0,
        addonCost: data.defaultAddonCost ?? 0,
        rebuyChips: data.defaultRebuyChips ?? 0,
        rebuyCost: data.defaultRebuyCost ?? 0,
        maxRebuys: data.defaultMaxRebuys ?? 0,
        maxAddons: data.defaultMaxAddons ?? 0,
      });
    }

    return this.getSeriesById(saved.id);
  }

  async getAllSeries(clubFilter?: string | null): Promise<TournamentSeries[]> {
    const series = await this.seriesRepository.find({
      where: clubFilter ? { clubId: clubFilter } : {},
      order: { periodStart: 'DESC' },
      relations: ['tournaments'],
    });
    if (clubFilter) {
      const global = await this.seriesRepository.find({
        where: { clubId: IsNull() },
        order: { periodStart: 'DESC' },
        relations: ['tournaments'],
      });
      return [...series, ...global].sort(
        (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
      );
    }
    return series;
  }

  async getSeriesById(id: string): Promise<TournamentSeries> {
    const s = await this.seriesRepository.findOne({
      where: { id },
      relations: ['tournaments'],
    });
    if (!s) throw new Error('Series not found');
    return s;
  }

  async ensureCanModify(id: string, managedClubId?: string | null): Promise<TournamentSeries> {
    const series = await this.getSeriesById(id);
    if (managedClubId && series.clubId !== managedClubId) {
      throw new Error('Forbidden: series belongs to another club');
    }
    return series;
  }

  async updateSeries(
    id: string,
    data: Partial<{ name: string; periodStart: Date; periodEnd: Date; daysOfWeek: number[] }>,
    managedClubId?: string | null
  ): Promise<TournamentSeries> {
    await this.ensureCanModify(id, managedClubId);
    const series = await this.getSeriesById(id);
    if (data.name) series.name = data.name;
    if (data.periodStart) series.periodStart = data.periodStart;
    if (data.periodEnd) series.periodEnd = data.periodEnd;
    if (data.daysOfWeek?.length)
      series.daysOfWeek = data.daysOfWeek.sort((a, b) => a - b).join(',');
    return this.seriesRepository.save(series);
  }

  async deleteSeries(id: string, managedClubId?: string | null): Promise<void> {
    const series = await this.ensureCanModify(id, managedClubId);
    if (series.tournaments?.length) {
      for (const t of series.tournaments) {
        await this.tournamentService.deleteTournament(t.id, undefined, { force: true });
      }
    }
    await this.leaderboardService.deleteLeaderboardsBySeriesId(id);
    await this.seriesRepository.remove(series);
  }

  getDaysOfWeekArray(series: TournamentSeries): number[] {
    return series.daysOfWeek
      ? series.daysOfWeek.split(',').map((s) => parseInt(s, 10))
      : [];
  }

  /**
   * Таблица рейтинга серии: игроки, итого очков, очки по датам турниров.
   * Колонки: Имя (№ карты) | Итого | Дата1 | Дата2 | ... (новые даты добавляются в 3-ю колонку)
   */
  async getSeriesRatingTable(seriesId: string): Promise<{
    seriesName: string;
    columns: { date: string; dateLabel: string }[];
    rows: { playerId: string; playerName: string; clubCardNumber?: string; totalPoints: number; pointsByDate: Record<string, number>; positionByDate: Record<string, number> }[];
  }> {
    const series = await this.getSeriesById(seriesId);
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const resultRepo = AppDataSource.getRepository(TournamentResult);

    const tournaments = await tournamentRepo.find({
      where: { series: { id: seriesId }, status: In(['ARCHIVED', 'FINISHED']) },
      order: { startTime: 'DESC' },
    });

    const columns = tournaments.map((t) => ({
      date: new Date(t.startTime).toISOString().slice(0, 10),
      dateLabel: new Date(t.startTime).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      tournamentId: t.id,
    }));

    const results = await resultRepo.find({
      where: { tournament: { id: In(tournaments.map((t) => t.id)) } },
      relations: ['player', 'player.user', 'tournament'],
    });

    const byPlayer = new Map<string, { playerId: string; playerName: string; clubCardNumber?: string; totalPoints: number; pointsByDate: Record<string, number>; positionByDate: Record<string, number> }>();

    for (const r of results) {
      const pid = r.player?.id;
      if (!pid) continue;
      const dateKey = r.tournament ? new Date(r.tournament.startTime).toISOString().slice(0, 10) : '';
      const pts = r.points ?? 0;
      const pos = r.finishPosition ?? 0;

      if (!byPlayer.has(pid)) {
        byPlayer.set(pid, {
          playerId: pid,
          playerName: r.player?.user?.name || 'Игрок',
          clubCardNumber: r.player?.user?.clubCardNumber,
          totalPoints: 0,
          pointsByDate: {},
          positionByDate: {},
        });
      }
      const row = byPlayer.get(pid)!;
      row.totalPoints += pts;
      if (dateKey) {
        row.pointsByDate[dateKey] = pts;
        row.positionByDate[dateKey] = pos;
      }
    }

    const rows = Array.from(byPlayer.values()).sort((a, b) => b.totalPoints - a.totalPoints);

    return { seriesName: series.name, columns, rows };
  }
}
