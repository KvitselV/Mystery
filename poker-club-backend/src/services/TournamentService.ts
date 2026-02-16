import { AppDataSource } from '../config/database';
import { FindOptionsWhere } from 'typeorm';
import { Tournament } from '../models/Tournament';
import { TournamentResult } from '../models/TournamentResult';
import { TournamentSeries } from '../models/TournamentSeries';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { TournamentReward } from '../models/TournamentReward';
import { Reward } from '../models/Reward';
import { PlayerProfile } from '../models/PlayerProfile';
import { PlayerOperation } from '../models/PlayerOperation';
import { PlayerBill } from '../models/PlayerBill';
import { Order } from '../models/Order';
import { AchievementInstance } from '../models/AchievementInstance';
import { FinancialService } from './FinancialService';
import { Club } from '../models/Club';
import { SeatingService } from './SeatingService';
import { LiveStateService } from './LiveStateService';

export class TournamentService {
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private seriesRepository = AppDataSource.getRepository(TournamentSeries);
  private seatingService = new SeatingService();
  private liveStateService = new LiveStateService();
  private registrationRepository = AppDataSource.getRepository(TournamentRegistration);
  private tournamentRewardRepository = AppDataSource.getRepository(TournamentReward);
  private rewardRepository = AppDataSource.getRepository(Reward);
  private playerRepository = AppDataSource.getRepository(PlayerProfile);
  private clubRepository = AppDataSource.getRepository(Club);
  private financialService = new FinancialService();
  private playerOperationRepository = AppDataSource.getRepository(PlayerOperation);
  private playerBillRepository = AppDataSource.getRepository(PlayerBill);
  private orderRepository = AppDataSource.getRepository(Order);
  private achievementInstanceRepository = AppDataSource.getRepository(AchievementInstance);

  /**
   * Создать турнир
   */
  async createTournament(data: {
    name: string;
    seriesId?: string;
    clubId?: string;
    startTime: Date;
    buyInCost: number;
    startingStack: number;
    addonChips?: number;
    addonCost?: number;
    rebuyChips?: number;
    rebuyCost?: number;
    maxRebuys?: number;
    maxAddons?: number;
    blindStructureId?: string;
    rewards?: { rewardId: string; place: number }[];
  }): Promise<Tournament> {
    const series = data.seriesId
      ? await this.seriesRepository.findOne({ where: { id: data.seriesId } })
      : null;

    const club = data.clubId
      ? await this.clubRepository.findOne({ where: { id: data.clubId } })
      : null;

    if (data.clubId && !club) {
      throw new Error('Club not found');
    }

    const startDate = new Date(data.startTime);
    const today = new Date();
    const isToday =
      startDate.getFullYear() === today.getFullYear() &&
      startDate.getMonth() === today.getMonth() &&
      startDate.getDate() === today.getDate();
    const initialStatus = isToday ? 'REG_OPEN' : 'ANNOUNCED';

    const tournament = this.tournamentRepository.create({
      name: data.name,
      series: series || undefined,
      club: club || undefined,
      clubId: club?.id,
      startTime: data.startTime,
      buyInCost: data.buyInCost,
      startingStack: data.startingStack,
      addonChips: data.addonChips ?? 0,
      addonCost: data.addonCost ?? 0,
      rebuyChips: data.rebuyChips ?? 0,
      rebuyCost: data.rebuyCost ?? 0,
      maxRebuys: data.maxRebuys ?? 0,
      maxAddons: data.maxAddons ?? 0,
      blindStructureId: data.blindStructureId,
      status: initialStatus,
      currentLevelNumber: 0,
    });

    const saved = await this.tournamentRepository.save(tournament);

    if (data.rewards?.length) {
      await this.setTournamentRewards(saved.id, data.rewards);
    }

    if (saved.clubId) {
      try {
        await this.seatingService.initializeTablesFromClub(saved.id);
      } catch (err) {
        console.warn('Auto-init tables from club failed:', err instanceof Error ? err.message : err);
      }
    }

    return await this.getTournamentById(saved.id);
  }

  /**
   * Синхронизация статусов по дате: турниры с startTime сегодня и статусом ANNOUNCED
   * переводятся в REG_OPEN. Вызывается периодически (каждый час).
   * Админ по‑прежнему может вручную открыть регистрацию для любого турнира.
   */
  async syncTournamentStatusByDate(): Promise<number> {
    const today = new Date();
    const tournaments = await this.tournamentRepository.find({
      where: { status: 'ANNOUNCED' },
    });

    let updated = 0;
    for (const t of tournaments) {
      const start = new Date(t.startTime);
      const isToday =
        start.getFullYear() === today.getFullYear() &&
        start.getMonth() === today.getMonth() &&
        start.getDate() === today.getDate();
      if (isToday) {
        t.status = 'REG_OPEN';
        await this.tournamentRepository.save(t);
        updated++;
      }
    }
    return updated;
  }

  /**
   * Установить награды турнира (место -> награда). Заменяет текущий список.
   */
  async setTournamentRewards(
    tournamentId: string,
    rewards: { rewardId: string; place: number }[]
  ): Promise<void> {
    const tournament = await this.tournamentRepository.findOne({ where: { id: tournamentId } });
    if (!tournament) throw new Error('Tournament not found');

    await this.tournamentRewardRepository.delete({ tournament: { id: tournamentId } });

    for (const { rewardId, place } of rewards) {
      const reward = await this.rewardRepository.findOne({ where: { id: rewardId } });
      if (!reward) throw new Error(`Reward not found: ${rewardId}`);
      const tr = this.tournamentRewardRepository.create({
        tournament,
        reward,
        place,
      });
      await this.tournamentRewardRepository.save(tr);
    }
  }

  /**
   * Получить список турниров
   */
  async getTournaments(filters?: {
    status?: string;
    seriesId?: string;
    clubId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tournaments: Tournament[]; total: number }> {
    const where: FindOptionsWhere<Tournament> = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.seriesId) {
      where.series = { id: filters.seriesId };
    }

    if (filters?.clubId) {
      where.club = { id: filters.clubId };
    }

    const [tournaments, total] = await this.tournamentRepository.findAndCount({
      where,
      relations: ['series', 'club', 'rewards', 'rewards.reward'],
      order: { startTime: 'ASC' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return { tournaments, total };
  }

  /**
   * Регистрация игрока на турнир.
   * Разрешена только при REG_OPEN (до старта) или LATE_REG (поздняя регистрация).
   * При RUNNING регистрация закрыта (после перерыва "конец поздней регистрации").
   */
  async registerPlayer(
    tournamentId: string,
    playerProfileId: string,
    paymentMethod: 'CASH' | 'DEPOSIT' = 'DEPOSIT',
    isArrived: boolean = true
  ): Promise<TournamentRegistration> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'REG_OPEN' && tournament.status !== 'LATE_REG') {
      throw new Error('Tournament is not open for registration');
    }

    // Проверь, не зарегистрирован ли уже
    const existingReg = await this.registrationRepository.findOne({
      where: {
        tournament: { id: tournamentId },
        player: { id: playerProfileId },
      },
    });

    if (existingReg) {
      throw new Error('Player already registered');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerProfileId },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Оплата в конце турнира: бай-ин учитывается в турнирном балансе, списание при оплате
    const buyInAmount = tournament.buyInCost ?? 0;
    if (buyInAmount > 0) {
      const operation = this.playerOperationRepository.create({
        playerProfile: player,
        operationType: 'BUYIN',
        amount: buyInAmount,
        tournament,
      });
      await this.playerOperationRepository.save(operation);
    }

    const registration = this.registrationRepository.create({
      tournament,
      player,
      registeredAt: new Date(),
      paymentMethod,
      isActive: true,
      isArrived,
      currentStack: tournament.startingStack,
    });

    await this.registrationRepository.save(registration);
    return registration;
  }

  /**
   * Получить участников турнира
   */
  async getTournamentPlayers(tournamentId: string): Promise<TournamentRegistration[]> {
    return await this.registrationRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: ['player', 'player.user'],
      order: { registeredAt: 'ASC' },
    });
  }

  /**
   * ID игроков, имеющих результат в турнире (вылетевших)
   */
  async getEliminatedPlayerIds(tournamentId: string): Promise<Set<string>> {
    const resultRepo = AppDataSource.getRepository(TournamentResult);
    const results = await resultRepo.find({
      where: { tournament: { id: tournamentId } },
      select: ['player'],
      relations: ['player'],
    });
    return new Set(results.map((r) => r.player?.id).filter(Boolean) as string[]);
  }

  /** Отметить игрока как прибывшего в клуб (управляющий нажал «Прибыл») */
  async markPlayerArrived(tournamentId: string, registrationId: string, managedClubId?: string | null): Promise<TournamentRegistration> {
    await this.ensureTournamentBelongsToClub(tournamentId, managedClubId);
    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId, tournament: { id: tournamentId } },
      relations: ['player', 'player.user'],
    });
    if (!registration) throw new Error('Registration not found');
    registration.isArrived = true;
    await this.registrationRepository.save(registration);
    return registration;
  }

  async ensureTournamentBelongsToClub(tournamentId: string, managedClubId?: string | null): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({ where: { id: tournamentId } });
    if (!tournament) throw new Error('Tournament not found');
    if (managedClubId && tournament.clubId !== managedClubId) {
      throw new Error('Forbidden: tournament belongs to another club');
    }
    return tournament;
  }

  async updateTournament(
    tournamentId: string,
    data: Partial<{
      name: string;
      seriesId: string | null;
      clubId: string | null;
      startTime: Date;
      buyInCost: number;
      startingStack: number;
      addonChips: number;
      addonCost: number;
      rebuyChips: number;
      rebuyCost: number;
      maxRebuys: number;
      maxAddons: number;
      blindStructureId: string | null;
    }>,
    managedClubId?: string | null
  ): Promise<Tournament> {
    await this.ensureTournamentBelongsToClub(tournamentId, managedClubId);
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) throw new Error('Tournament not found');

    if (data.name != null) tournament.name = data.name;
    if (data.startTime != null) tournament.startTime = data.startTime;
    if (data.buyInCost != null) tournament.buyInCost = data.buyInCost;
    if (data.startingStack != null) tournament.startingStack = data.startingStack;
    if (data.addonChips != null) tournament.addonChips = data.addonChips;
    if (data.addonCost != null) tournament.addonCost = data.addonCost;
    if (data.rebuyChips != null) tournament.rebuyChips = data.rebuyChips;
    if (data.rebuyCost != null) tournament.rebuyCost = data.rebuyCost;
    if (data.maxRebuys != null) tournament.maxRebuys = data.maxRebuys;
    if (data.maxAddons != null) tournament.maxAddons = data.maxAddons;
    if (data.blindStructureId != null) tournament.blindStructureId = data.blindStructureId;
    if (data.clubId != null) tournament.clubId = data.clubId;

    if (data.seriesId !== undefined) {
      if (data.seriesId) {
        const series = await this.seriesRepository.findOne({ where: { id: data.seriesId } });
        if (series) tournament.series = series;
      } else {
        (tournament as { series?: TournamentSeries | null }).series = null;
      }
    }

    if (data.clubId !== undefined && data.clubId) {
      const club = await this.clubRepository.findOne({ where: { id: data.clubId } });
      (tournament as { club?: Club | null }).club = club ?? null;
    } else if (data.clubId === null) {
      (tournament as { club?: Club | null }).club = null;
    }

    return this.tournamentRepository.save(tournament);
  }

  async deleteTournament(tournamentId: string, managedClubId?: string | null, options?: { force?: boolean }): Promise<void> {
    if (!options?.force) {
      await this.ensureTournamentBelongsToClub(tournamentId, managedClubId);
    }
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) throw new Error('Tournament not found');
    if (!options?.force && tournament.status !== 'ANNOUNCED' && tournament.status !== 'REG_OPEN' && tournament.status !== 'ARCHIVED') {
      throw new Error('Can only delete tournaments in ANNOUNCED, REG_OPEN or ARCHIVED status');
    }
    // Явно удаляем связанные записи (обходим FK-ограничения при старом schema)
    await this.liveStateService.deleteLiveState(tournamentId);
    await this.playerOperationRepository.delete({ tournament: { id: tournamentId } });
    await this.playerBillRepository.delete({ tournament: { id: tournamentId } });
    await this.orderRepository.update({ tournamentId }, { tournamentId: null! });
    await this.achievementInstanceRepository.update({ tournamentId }, { tournamentId: null! });
    await this.tournamentRepository.remove(tournament);
  }

  async updateTournamentStatus(
    tournamentId: string,
    status: 'ANNOUNCED' | 'REG_OPEN' | 'LATE_REG' | 'RUNNING' | 'FINISHED' | 'ARCHIVED',
    managedClubId?: string | null
  ): Promise<Tournament> {
    await this.ensureTournamentBelongsToClub(tournamentId, managedClubId);
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    tournament.status = status;

    const saved = await this.tournamentRepository.save(tournament);

    // При переходе в RUNNING/LATE_REG — пересчитать live state (игроки, входы, стек) для таймера
    if (status === 'RUNNING' || status === 'LATE_REG') {
      await this.liveStateService.recalculateStats(tournamentId);
    }

    return saved;
  }

  /**
   * Получить турнир по ID
   */
  async getTournamentById(tournamentId: string): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['series', 'club', 'registrations', 'rewards', 'rewards.reward'],
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    return tournament;
  }

      /**
   * Отменить регистрацию на турнир
   */
  async unregisterFromTournament(
    userId: string,
    tournamentId: string
  ): Promise<void> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Проверка статуса турнира
    if (tournament.status !== 'REG_OPEN') {
      throw new Error('Cannot unregister from started or completed tournament');
    }

    const playerProfile = await this.playerRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'balance'],
    });

    if (!playerProfile) {
      throw new Error('Player profile not found');
    }

    // Найти регистрацию
    const registration = await this.registrationRepository.findOne({
      where: {
        tournament: { id: tournamentId },
        player: { id: playerProfile.id },
      },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    // Удалить операцию BUYIN (бай-ин был в турнирном счёте)
    await this.playerOperationRepository.delete({
      playerProfile: { id: playerProfile.id },
      tournament: { id: tournamentId },
      operationType: 'BUYIN',
    });

    await this.registrationRepository.remove(registration);
  }



}
