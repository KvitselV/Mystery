import { AppDataSource } from '../config/database';
import { Tournament } from '../models/Tournament';
import { PlayerProfile } from '../models/PlayerProfile';
import { PlayerOperation } from '../models/PlayerOperation';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { TournamentResult } from '../models/TournamentResult';
import { BlindStructure } from '../models/BlindStructure';
import { TournamentLevel } from '../models/TournamentLevel';
import { SeatingService } from './SeatingService';
import { MMRService } from './MMRService';
import { LeaderboardService } from './LeaderboardService';
import { LiveStateService } from './LiveStateService';
import { AchievementService } from './AchievementService';
import { StatisticsService } from './StatisticsService';

export class LiveTournamentService {
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private playerRepository = AppDataSource.getRepository(PlayerProfile);
  private operationRepository = AppDataSource.getRepository(PlayerOperation);
  private registrationRepository = AppDataSource.getRepository(TournamentRegistration);
  private resultRepository = AppDataSource.getRepository(TournamentResult);
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

    // Проверка статуса турнира (ребаи доступны только в LATE_REG или RUNNING)
    if (tournament.status !== 'LATE_REG' && tournament.status !== 'RUNNING') {
      throw new Error('Rebuys are not available for this tournament status');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerProfileId },
      relations: ['balance'],
    });

    if (!player) {
      throw new Error('Player not found');
    }

    const rebuyAmount = amount ?? tournament.buyInCost;
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

    // Аддоны обычно доступны на определенных уровнях или перед финальным столом
    if (tournament.status !== 'RUNNING') {
      throw new Error('Addons are not available for this tournament status');
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
   * Выбытие игрока с записью результата
   */
  async eliminatePlayer(
    tournamentId: string,
    playerProfileId: string,
    finishPosition: number,
  ): Promise<TournamentResult> {
    console.log('ELIMINATE CALLED:', {
      tournamentId,
      playerProfileId,
      finishPosition,
    });

    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      console.error('ELIMINATE ERROR: Tournament not found');
      throw new Error('Tournament not found');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerProfileId },
      relations: ['balance', 'user'],
    });

    if (!player) {
      console.error('ELIMINATE ERROR: Player not found');
      throw new Error('Player not found');
    }

    await this.seatingService.eliminatePlayer(playerProfileId, finishPosition);

    await this.liveStateService.recalculateStats(tournamentId);

    console.log('CREATING RESULT:', {
      tournamentId: tournament.id,
      playerId: player.id,
      finishPosition,
    });

    const result = this.resultRepository.create({
      tournament,
      player,
      finishPosition,
      isFinalTable: finishPosition <= 9,
    });

    const savedResult = await this.resultRepository.save(result);

    console.log('SAVED RESULT ID:', savedResult.id);



    try {
      if (player.user?.id) {
        console.log(`📊 Updating statistics for player ${player.user.id}...`);
        await this.statisticsService.updatePlayerStatistics(
          player.user.id,
          tournamentId
        );

        console.log(`🏆 Checking achievements for player ${player.user.id}...`);
        const grantedAchievements =
          await this.achievementService.checkAndGrantAchievements(
            player.user.id,
            tournamentId
          );

        if (grantedAchievements.length > 0) {
          console.log(
            `🎉 Player ${player.user.id} earned ${grantedAchievements.length} achievement(s):`,
            grantedAchievements.map((a) => a.achievementType?.code || 'unknown')
          );
        }
      }
    } catch (error) {
      console.error('❌ Error updating statistics/achievements:', error);
      // Не прерываем выполнение, просто логируем ошибку
    }

    return savedResult;
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

    // Обновить текущий уровень
    tournament.currentLevelNumber = nextLevelNumber;
    await this.tournamentRepository.save(tournament);

    return {
      tournament,
      currentLevel: nextLevel,
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

    // Проверка что турнир в статусе RUNNING
    if (tournament.status !== 'RUNNING') {
      throw new Error('Tournament is not running');
    }

    // 1. Изменить статус турнира на FINISHED
    tournament.status = 'FINISHED';
    await this.tournamentRepository.save(tournament);

    console.log(`🏁 Tournament ${tournamentId} finished`);

    // 2. Удалить live state
    await this.liveStateService.deleteLiveState(tournamentId);

    // 3. Обновить MMR и лидерборды
    await this.mmrService.recalculateTournamentMMR(tournamentId);
    await this.leaderboardService.updateLeaderboardsAfterTournament(
      tournamentId
    );


    try {
      console.log(
        `📊 Updating statistics and achievements for all players...`
      );

      // Получить все результаты турнира
      const results = await this.resultRepository
        .createQueryBuilder('result')
        .leftJoinAndSelect('result.player', 'player')
        .leftJoinAndSelect('player.user', 'user')
        .where('result.tournamentId = :tournamentId', { tournamentId })
        .getMany();

      console.log(`Found ${results.length} results to process`);

      // Обработать каждого игрока
      for (const result of results) {
        try {
          const userId = result.player?.user?.id;

          if (!userId) {
            console.warn(
              `⚠️ Skipping result ${result.id}: no user ID found`
            );
            continue;
          }

          // Обновить статистику
          await this.statisticsService.updatePlayerStatistics(
            userId,
            tournamentId
          );

          // Проверить достижения
          const grantedAchievements =
            await this.achievementService.checkAndGrantAchievements(
              userId,
              tournamentId
            );

          if (grantedAchievements.length > 0) {
            console.log(
              `🏆 Player ${userId} earned ${grantedAchievements.length} achievement(s):`,
              grantedAchievements.map(
                (a) => a.achievementType?.code || 'unknown'
              )
            );
          }
        } catch (error) {
          console.error(
            `❌ Error processing player ${result.player?.id}:`,
            error
          );
        }
      }

      console.log('✅ All statistics and achievements updated');
    } catch (error) {
      console.error('❌ Error in statistics/achievements update:', error);
    }
    

    console.log(
      `✅ Tournament ${tournamentId} completed: MMR and leaderboards updated`
    );
  }
}
