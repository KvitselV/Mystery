import { AppDataSource } from '../config/database';
import { Tournament } from '../models/Tournament';
import { PlayerProfile } from '../models/PlayerProfile';
import { PlayerOperation } from '../models/PlayerOperation';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { TournamentResult } from '../models/TournamentResult';
import { TournamentPayment } from '../models/TournamentPayment';
import { TournamentAdminReport } from '../models/TournamentAdminReport';
import { BlindStructure } from '../models/BlindStructure';
import { TournamentLevel } from '../models/TournamentLevel';
import { SeatingService } from './SeatingService';
import { MMRService } from './MMRService';
import { LeaderboardService } from './LeaderboardService';
import { LiveStateService } from './LiveStateService';
import { AchievementService } from './AchievementService';
import { StatisticsService } from './StatisticsService';
import { tournamentQueue } from '../config/queues';

export class LiveTournamentService {
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private playerRepository = AppDataSource.getRepository(PlayerProfile);
  private operationRepository = AppDataSource.getRepository(PlayerOperation);
  private registrationRepository = AppDataSource.getRepository(TournamentRegistration);
  private resultRepository = AppDataSource.getRepository(TournamentResult);
  private paymentRepository = AppDataSource.getRepository(TournamentPayment);
  private adminReportRepository = AppDataSource.getRepository(TournamentAdminReport);
  private blindStructureRepository = AppDataSource.getRepository(BlindStructure);
  private levelRepository = AppDataSource.getRepository(TournamentLevel);
  private liveStateService = new LiveStateService();
  private seatingService = new SeatingService();
  private mmrService = new MMRService();
  private leaderboardService = new LeaderboardService();
  private achievementService = new AchievementService();
  private statisticsService = new StatisticsService();

  
  async rebuy(
    tournamentId: string,
    playerProfileId: string,
    amount?: number
  ): Promise<PlayerOperation> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Ребаи доступны только во время поздней регистрации (LATE_REG), не после её окончания (RUNNING)
    if (tournament.status !== 'LATE_REG') {
      throw new Error('Ребаи доступны только во время поздней регистрации');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerProfileId },
      relations: ['balance'],
    });

    if (!player) {
      throw new Error('Player not found');
    }

    const rebuyAmount = amount ?? (tournament.rebuyCost ?? tournament.buyInCost);
    const rebuyChips = tournament.rebuyChips ?? 0;

    const registration = await this.registrationRepository.findOne({
      where: {
        tournament: { id: tournamentId },
        player: { id: playerProfileId },
      },
    });
    if (!registration) {
      throw new Error('Player is not registered for this tournament');
    }

    const maxRebuys = tournament.maxRebuys ?? 0;
    if (maxRebuys > 0) {
      const usedRebuys = await this.operationRepository.count({
        where: {
          playerProfile: { id: playerProfileId },
          tournament: { id: tournamentId },
          operationType: 'REBUY',
        },
      });
      if (usedRebuys >= maxRebuys) {
        throw new Error(`Player has reached the maximum of ${maxRebuys} rebuys`);
      }
    }

    // Ребай добавляется в турнирный баланс, оплата при выходе
    const operation = this.operationRepository.create({
      playerProfile: player,
      operationType: 'REBUY',
      amount: rebuyAmount,
      tournament,
    });
    const savedOp = await this.operationRepository.save(operation);

    registration.currentStack += rebuyChips;
    await this.registrationRepository.save(registration);

    await this.liveStateService.recalculateStats(tournamentId);

    return savedOp;
  }

  /**
   * Аддон - игрок докупает дополнительные фишки
   */
  async addon(
    tournamentId: string,
    playerProfileId: string,
    amount: number
  ): Promise<PlayerOperation> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Аддоны доступны только во время аддонного перерыва
    const currentLevel = await this.getCurrentLevel(tournamentId);
    const isAddonBreak = currentLevel?.isBreak &&
      (currentLevel.breakType === 'ADDON' || currentLevel.breakType === 'END_LATE_REG_AND_ADDON');
    if (!isAddonBreak) {
      throw new Error('Аддоны доступны только во время аддонного перерыва');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerProfileId },
      relations: ['balance'],
    });

    if (!player) {
      throw new Error('Player not found');
    }

    const addonChips = tournament.addonChips ?? 0;

    const registration = await this.registrationRepository.findOne({
      where: {
        tournament: { id: tournamentId },
        player: { id: playerProfileId },
      },
    });
    if (!registration) {
      throw new Error('Player is not registered for this tournament');
    }

    const maxAddons = tournament.maxAddons ?? 0;
    if (maxAddons > 0) {
      const usedAddons = await this.operationRepository.count({
        where: {
          playerProfile: { id: playerProfileId },
          tournament: { id: tournamentId },
          operationType: 'ADDON',
        },
      });
      if (usedAddons >= maxAddons) {
        throw new Error(`Player has reached the maximum of ${maxAddons} addons`);
      }
    }

    // Аддон добавляется в турнирный баланс, оплата при выходе
    const operation = this.operationRepository.create({
      playerProfile: player,
      operationType: 'ADDON',
      amount,
      tournament,
    });
    const savedOp = await this.operationRepository.save(operation);

    registration.currentStack += addonChips;
    await this.registrationRepository.save(registration);

    await this.liveStateService.recalculateStats(tournamentId);

    return savedOp;
  }

  /**
   * Выбытие игрока с записью результата.
   * finishPosition — место вылета. Если не указано, считается автоматически
   * (следующее место после уже вылетевших).
   */
  async eliminatePlayer(
    tournamentId: string,
    playerProfileId: string,
    finishPosition?: number,
  ): Promise<TournamentResult> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerProfileId },
      relations: ['balance', 'user'],
    });

    if (!player) {
      throw new Error('Player not found');
    }

    let pos = finishPosition;
    if (pos == null || pos < 1) {
      const count = await this.resultRepository.count({ where: { tournament: { id: tournamentId } } });
      const totalPlayers = await this.registrationRepository.count({ where: { tournament: { id: tournamentId } } });
      // Первый вылетевший = последнее место (totalPlayers), последний вылетевший = 2-е место
      pos = totalPlayers - count;
    }

    await this.seatingService.eliminatePlayer(playerProfileId, pos, tournamentId);

    const registration = await this.registrationRepository.findOne({
      where: { tournament: { id: tournamentId }, player: { id: playerProfileId } },
    });
    if (registration) {
      registration.isActive = false;
      registration.currentStack = 0; // Вылетел — фишки кончились (перешли победителю)
      await this.registrationRepository.save(registration);
    }

    await this.liveStateService.recalculateStats(tournamentId);

    let savedResult: TournamentResult;
    const existingResult = await this.resultRepository.findOne({
      where: {
        tournament: { id: tournamentId },
        player: { id: playerProfileId },
      },
    });
    if (existingResult) {
      existingResult.finishPosition = pos;
      existingResult.isFinalTable = pos <= 9;
      savedResult = await this.resultRepository.save(existingResult);
    } else {
      const result = this.resultRepository.create({
        tournament,
        player,
        finishPosition: pos,
        isFinalTable: pos <= 9,
      });
      savedResult = await this.resultRepository.save(result);
    }

    if (player.user?.id) {
      await tournamentQueue.add('update-stats', { type: 'UPDATE_STATS', userId: player.user.id, tournamentId });
      await tournamentQueue.add('check-achievements', { type: 'CHECK_ACHIEVEMENTS', userId: player.user.id, tournamentId });
    }

    return savedResult;
  }

  /**
   * Вернуть вылетевшего игрока: ребай + реактивация + посадка на стол.
   * Доступно только во время поздней регистрации и при наличии неиспользованного ребая.
   */
  async returnEliminatedPlayer(
    tournamentId: string,
    playerProfileId: string,
    tableId: string,
    seatNumber: number
  ): Promise<{ message: string }> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) throw new Error('Tournament not found');

    if (tournament.status !== 'LATE_REG') {
      throw new Error('Возврат возможен только во время поздней регистрации');
    }

    const registration = await this.registrationRepository.findOne({
      where: {
        tournament: { id: tournamentId },
        player: { id: playerProfileId },
      },
    });
    if (!registration) throw new Error('Игрок не зарегистрирован');
    if (registration.isActive) throw new Error('Игрок уже в турнире');

    const maxRebuys = tournament.maxRebuys ?? 0;
    const usedRebuys = await this.operationRepository.count({
      where: {
        playerProfile: { id: playerProfileId },
        tournament: { id: tournamentId },
        operationType: 'REBUY',
      },
    });
    if (maxRebuys > 0 && usedRebuys >= maxRebuys) {
      throw new Error(`Игрок использовал все ребаи (макс. ${maxRebuys})`);
    }

    const existingResult = await this.resultRepository.findOne({
      where: {
        tournament: { id: tournamentId },
        player: { id: playerProfileId },
      },
    });
    if (existingResult) {
      const oldPosition = existingResult.finishPosition; // 1 = победитель, N = последнее место
      await this.resultRepository.remove(existingResult);
      // Сдвиг: игроки с местами хуже удалённого (например 6,7,... при удалении 5) сдвигаются вверх
      const toShift = await this.resultRepository.find({
        where: { tournament: { id: tournamentId } },
        order: { finishPosition: 'ASC' },
      });
      for (const r of toShift) {
        if (r.finishPosition > oldPosition) {
          r.finishPosition -= 1;
          await this.resultRepository.save(r);
        }
      }
    }

    registration.isActive = true;
    await this.registrationRepository.save(registration);

    await this.rebuy(tournamentId, playerProfileId);
    await this.seatingService.manualReseating(tournamentId, playerProfileId, tableId, seatNumber);

    await this.liveStateService.recalculateStats(tournamentId);

    return { message: 'Игрок возвращён в турнир' };
  }

  async moveToNextLevel(tournamentId: string): Promise<{
    tournament: Tournament;
    currentLevel: TournamentLevel | null;
  }> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (!tournament.blindStructureId) {
      throw new Error('Tournament has no blind structure assigned');
    }

    const nextLevelNumber = tournament.currentLevelNumber + 1;

    // Получить следующий уровень
    const blindStructureService = AppDataSource.getRepository(BlindStructure);
    const structure = await blindStructureService.findOne({
      where: { id: tournament.blindStructureId },
      relations: ['levels'],
    });

    if (!structure) {
      throw new Error('Blind structure not found');
    }

    const nextLevel = structure.levels.find(
      (level) => level.levelNumber === nextLevelNumber
    );

    if (!nextLevel) {
      throw new Error('No more levels available');
    }

    // При выходе из перерыва с "конец поздней регистрации" — сменить статус на RUNNING
    const currentLevel = structure.levels.find(
      (l) => l.levelNumber === tournament.currentLevelNumber
    );
    if (currentLevel?.isBreak && (currentLevel.breakType === 'END_LATE_REG' || currentLevel.breakType === 'END_LATE_REG_AND_ADDON')) {
      if (tournament.status === 'LATE_REG') {
        tournament.status = 'RUNNING';
      }
    }

    tournament.currentLevelNumber = nextLevelNumber;
    await this.tournamentRepository.save(tournament);

    return {
      tournament,
      currentLevel: nextLevel,
    };
  }

  async moveToPrevLevel(tournamentId: string): Promise<{
    tournament: Tournament;
    currentLevel: TournamentLevel | null;
  }> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (!tournament.blindStructureId) {
      throw new Error('Tournament has no blind structure assigned');
    }

    const prevLevelNumber = tournament.currentLevelNumber - 1;
    if (prevLevelNumber < 1) {
      throw new Error('Already at first level');
    }

    const blindStructureService = AppDataSource.getRepository(BlindStructure);
    const structure = await blindStructureService.findOne({
      where: { id: tournament.blindStructureId },
      relations: ['levels'],
    });

    if (!structure) {
      throw new Error('Blind structure not found');
    }

    const prevLevel = structure.levels.find(
      (level) => level.levelNumber === prevLevelNumber
    );

    if (!prevLevel) {
      throw new Error('Previous level not found');
    }

    tournament.currentLevelNumber = prevLevelNumber;
    await this.tournamentRepository.save(tournament);

    return {
      tournament,
      currentLevel: prevLevel,
    };
  }

  async getCurrentLevel(tournamentId: string): Promise<TournamentLevel | null> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament || !tournament.blindStructureId) {
      return null;
    }

    const structure = await this.blindStructureRepository.findOne({
      where: { id: tournament.blindStructureId },
      relations: ['levels'],
    });

    if (!structure) {
      return null;
    }

    return (
      structure.levels.find(
        (level) => level.levelNumber === tournament.currentLevelNumber
      ) || null
    );
  }

  async getNextLevel(tournamentId: string): Promise<TournamentLevel | null> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });
    if (!tournament || !tournament.blindStructureId) return null;
    const structure = await this.blindStructureRepository.findOne({
      where: { id: tournament.blindStructureId },
      relations: ['levels'],
    });
    if (!structure) return null;
    return (
      structure.levels.find(
        (level) => level.levelNumber === tournament.currentLevelNumber + 1
      ) || null
    );
  }

  /**
   * Получить все операции игрока в турнире
   */
  async getPlayerOperationsInTournament(
    playerProfileId: string
  ): Promise<PlayerOperation[]> {
    return this.operationRepository.find({
      where: { playerProfile: { id: playerProfileId } },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Завершить турнир и обновить все рейтинги
   */
  async finishTournament(tournamentId: string): Promise<void> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Проверка что турнир в статусе RUNNING или LATE_REG
    if (tournament.status !== 'RUNNING' && tournament.status !== 'LATE_REG') {
      throw new Error('Tournament is not running');
    }

    // 1. Изменить статус турнира на ARCHIVED
    tournament.status = 'ARCHIVED';
    await this.tournamentRepository.save(tournament);

    // 2. Создать отчёт для администратора (данные можно редактировать позже)
    const arrivedCount = await this.registrationRepository.count({
      where: { tournament: { id: tournamentId }, isArrived: true },
    });
    const payments = await this.paymentRepository.find({
      where: { tournamentId },
    });
    const cashRevenue = payments.reduce((s, p) => s + p.cashAmount, 0);
    const nonCashRevenue = payments.reduce((s, p) => s + p.nonCashAmount, 0);
    const report = this.adminReportRepository.create({
      tournamentId,
      attendanceCount: arrivedCount,
      cashRevenue,
      nonCashRevenue,
      expenses: [],
      totalProfit: cashRevenue + nonCashRevenue,
    });
    await this.adminReportRepository.save(report);

    console.log(`🏁 Tournament ${tournamentId} finished → ARCHIVED`);

    // Создать результаты для всех оставшихся активных игроков (топ мест: 1, 2, 3, ...)
    const registrations = await this.registrationRepository.find({
      where: { tournament: { id: tournamentId }, isActive: true },
      relations: ['player'],
      order: { id: 'ASC' },
    });

    if (registrations.length > 0) {
      // Активные игроки (финальный стол) получают топовые места 1, 2, 3, ...
      let nextPosition = 1;
      for (const reg of registrations) {
        const player = reg.player;
        if (!player) continue;
        const hasResult = await this.resultRepository.findOne({
          where: { tournament: { id: tournamentId }, player: { id: player.id } },
        });
        if (hasResult) continue;

        const pos = nextPosition++;
        const result = this.resultRepository.create({
          tournament,
          player,
          finishPosition: pos,
          isFinalTable: pos <= 9,
        });
        await this.resultRepository.save(result);
        reg.isActive = false;
        await this.registrationRepository.save(reg);
      }
    }

    // 2. Удалить live state
    await this.liveStateService.deleteLiveState(tournamentId);

    // 3. Добавить тяжёлые задачи в очередь (MMR, лидерборды, статистика, достижения)
    await tournamentQueue.add('finish-tournament', { type: 'FINISH_TOURNAMENT', tournamentId });

    console.log(`✅ Tournament ${tournamentId} finished, background jobs queued`);
  }

  /**
   * Вызывается воркером для выполнения тяжёлых операций после завершения турнира
   */
  async processFinishTournamentJobs(tournamentId: string): Promise<void> {
    console.log(`📊 Processing finish jobs for tournament ${tournamentId}...`);

    await this.mmrService.recalculateTournamentMMR(tournamentId);
    await this.leaderboardService.updateLeaderboardsAfterTournament(tournamentId);

    const results = await this.resultRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.player', 'player')
      .leftJoinAndSelect('player.user', 'user')
      .where('result.tournament_id = :tournamentId', { tournamentId })
      .getMany();

    for (const result of results) {
      try {
        const userId = result.player?.user?.id;
        if (!userId) continue;

        await this.statisticsService.updatePlayerStatistics(userId, tournamentId);
        const granted = await this.achievementService.checkAndGrantAchievements(userId, tournamentId);
        if (granted.length > 0) {
          console.log(`🏆 Player ${userId} earned ${granted.length} achievement(s)`);
        }
      } catch (error) {
        console.error(`❌ Error processing player ${result.player?.id}:`, error);
      }
    }

    console.log(`✅ Tournament ${tournamentId} background jobs completed`);
  }
}
