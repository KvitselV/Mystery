import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { PlayerProfile } from '../models/PlayerProfile';
import { PlayerBalance } from '../models/PlayerBalance';
import { TournamentSeries } from '../models/TournamentSeries';
import { Tournament } from '../models/Tournament';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { TournamentResult } from '../models/TournamentResult';
import { LeaderboardService } from './LeaderboardService';
import bcrypt from 'bcrypt';

export interface ExcelImportPlayer {
  name: string;
  cardNumber: string;
}

export interface ExcelImportTournamentResult {
  cardNumber: string;
  points: number;
}

export interface ExcelImportTournament {
  date: string; // YYYY-MM-DD or parseable date
  results: ExcelImportTournamentResult[];
}

export interface ExcelImportData {
  clubId: string;
  seriesName: string;
  players: ExcelImportPlayer[];
  tournaments: ExcelImportTournament[];
}

export interface ExcelImportResult {
  playersCreated: number;
  playersSkipped: number;
  tournamentsCreated: number;
  seriesId: string;
  seriesName: string;
}

export class ExcelImportService {
  private userRepository = AppDataSource.getRepository(User);
  private playerRepository = AppDataSource.getRepository(PlayerProfile);
  private balanceRepository = AppDataSource.getRepository(PlayerBalance);
  private seriesRepository = AppDataSource.getRepository(TournamentSeries);
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private registrationRepository = AppDataSource.getRepository(TournamentRegistration);
  private resultRepository = AppDataSource.getRepository(TournamentResult);
  private leaderboardService = new LeaderboardService();

  /**
   * Импорт данных из Excel-подобной структуры.
   * - Создаёт игроков (пароль = номер_карты + "-"), пропускает существующих по clubCardNumber
   * - Создаёт турнирную серию и турниры
   * - Все турниры со статусом FINISHED
   * - Позиции по очкам (desc), при равенстве — меньший номер карты выше
   */
  async import(data: ExcelImportData): Promise<ExcelImportResult> {
    const cardToPlayer = new Map<string, { userId: string; playerProfileId: string }>();
    let playersCreated = 0;
    let playersSkipped = 0;

    // 1. Создать или получить игроков
    const passwordSuffix = '-';
    for (const p of data.players) {
      const cardNumber = String(p.cardNumber || '').trim();
      const name = String(p.name || '').trim();
      if (!cardNumber || !name) continue;

      const existing = await this.userRepository.findOne({ where: { clubCardNumber: cardNumber } });
      if (existing) {
        const profile = await this.playerRepository.findOne({
          where: { user: { id: existing.id } },
          relations: ['user'],
        });
        if (profile) {
          cardToPlayer.set(cardNumber, { userId: existing.id, playerProfileId: profile.id });
        }
        playersSkipped++;
        continue;
      }

      // phone должен быть уникальным — используем "import_" + cardNumber
      const phone = `import_${cardNumber}`;
      const password = cardNumber + passwordSuffix;
      const passwordHash = await bcrypt.hash(password, 10);

      const balance = this.balanceRepository.create({ depositBalance: 0, totalDeposited: 0 });
      const savedBalance = await this.balanceRepository.save(balance);

      const user = this.userRepository.create({
        name,
        clubCardNumber: cardNumber,
        phone,
        passwordHash,
        role: 'PLAYER',
        isActive: true,
      });
      const savedUser = await this.userRepository.save(user);

      const playerProfile = this.playerRepository.create({
        user: savedUser,
        balance: savedBalance,
        mmrValue: 0,
        rankCode: 'E',
        tournamentsCount: 0,
        winRate: 0,
        averageFinish: 0,
      });
      const savedProfile = await this.playerRepository.save(playerProfile);

      cardToPlayer.set(cardNumber, { userId: savedUser.id, playerProfileId: savedProfile.id });
      playersCreated++;
    }

    // 2. Даты турниров для periodStart/periodEnd
    const dates = data.tournaments.map((t) => this.parseDate(t.date)).filter(Boolean) as Date[];
    if (dates.length === 0) throw new Error('Нет валидных дат турниров');

    const periodStart = new Date(Math.min(...dates.map((d) => d.getTime())));
    const periodEnd = new Date(Math.max(...dates.map((d) => d.getTime())));
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);

    // 3. Создать серию без автотурниров
    const series = this.seriesRepository.create({
      name: data.seriesName.trim() || 'Импорт',
      periodStart,
      periodEnd,
      daysOfWeek: '0,1,2,3,4,5,6',
      clubId: data.clubId,
    });
    const savedSeries = await this.seriesRepository.save(series);

    await this.leaderboardService.getOrCreateLeaderboard(
      series.name,
      'TOURNAMENT_SERIES',
      periodStart,
      periodEnd,
      series.id
    );

    // 4. Создать турниры
    const defaultBuyIn = 3000;
    const defaultStartingStack = 10000;
    let tournamentsCreated = 0;

    for (const t of data.tournaments) {
      const date = this.parseDate(t.date);
      if (!date) continue;

      // 5. Регистрации и результаты — определяем статус
      const toCardKey = (c: string | number) => String(c ?? '').trim();
      const seen = new Set<string>();
      const uniqueResults = t.results.filter((r) => {
        const key = toCardKey(r.cardNumber);
        if (seen.has(key)) return false;
        seen.add(key);
        return cardToPlayer.has(key);
      });
      const sorted = [...uniqueResults].sort((a, b) => {
          const ptsA = Number(a.points) || 0;
          const ptsB = Number(b.points) || 0;
          if (ptsB !== ptsA) return ptsB - ptsA;
          const cardA = toCardKey(a.cardNumber);
          const cardB = toCardKey(b.cardNumber);
          return cardA.localeCompare(cardB, undefined, { numeric: true });
        });

      const hasAnyPoints = sorted.some((r) => (Number(r.points) || 0) > 0);
      const status = hasAnyPoints ? 'FINISHED' : 'ANNOUNCED';

      const startTime = new Date(date);
      startTime.setHours(19, 0, 0, 0);
      const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const name = `${data.seriesName.trim() || 'Импорт'} - ${dateStr}`;

      const tournament = this.tournamentRepository.create({
        name,
        series: savedSeries,
        clubId: data.clubId,
        startTime,
        buyInCost: defaultBuyIn,
        startingStack: defaultStartingStack,
        addonChips: 0,
        addonCost: 0,
        rebuyChips: 0,
        rebuyCost: 0,
        maxRebuys: 0,
        maxAddons: 0,
        status,
        currentLevelNumber: 0,
      });
      const savedTournament = await this.tournamentRepository.save(tournament);

      if (hasAnyPoints) {
        for (let i = 0; i < sorted.length; i++) {
          const r = sorted[i];
          const cardKey = toCardKey(r.cardNumber);
          const playerInfo = cardToPlayer.get(cardKey);
          if (!playerInfo) continue;

          const player = await this.playerRepository.findOne({ where: { id: playerInfo.playerProfileId } });
          if (!player) continue;

          // Регистрация
          const reg = this.registrationRepository.create({
            tournament: savedTournament,
            player,
            registeredAt: new Date(),
            paymentMethod: 'DEPOSIT',
            isActive: false,
            isArrived: true,
            currentStack: 0,
          });
          await this.registrationRepository.save(reg);

          // Результат: позиция 1 = победитель
          const finishPosition = i + 1;
          const points = Number(r.points) || 0;
          const result = this.resultRepository.create({
            tournament: savedTournament,
            player,
            finishPosition,
            points,
            mmrGained: 0,
            isFinalTable: finishPosition <= 9,
          });
          await this.resultRepository.save(result);
        }

        await this.leaderboardService.updateLeaderboardsAfterImport(savedTournament.id);
      }
      tournamentsCreated++;
    }

    return {
      playersCreated,
      playersSkipped,
      tournamentsCreated,
      seriesId: savedSeries.id,
      seriesName: savedSeries.name,
    };
  }

  private parseDate(value: string | number): Date | null {
    if (!value) return null;
    if (typeof value === 'number') {
      // Excel serial date
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + value * 86400000);
    }
    const s = String(value).trim();
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
}
