import { AppDataSource } from '../config/database';
import { Tournament } from '../models/Tournament';
import { PlayerProfile } from '../models/PlayerProfile';
import { PlayerOperation } from '../models/PlayerOperation';
import { TournamentResult } from '../models/TournamentResult';
import { BlindStructure } from '../models/BlindStructure';
import { TournamentLevel } from '../models/TournamentLevel';
import { SeatingService } from './SeatingService';

export class LiveTournamentService {
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private playerRepository = AppDataSource.getRepository(PlayerProfile);
  private operationRepository = AppDataSource.getRepository(PlayerOperation);
  private resultRepository = AppDataSource.getRepository(TournamentResult);
  private blindStructureRepository = AppDataSource.getRepository(BlindStructure);
  private levelRepository = AppDataSource.getRepository(TournamentLevel);
  private seatingService = new SeatingService();

  /**
   * Ребай - игрок докупает фишки
   */
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

    const rebuyAmount = amount || tournament.buyInAmount;

    // Проверка баланса
    if (!player.balance || player.balance.depositBalance < rebuyAmount) {
      throw new Error('Insufficient balance for rebuy');
    }

    // Списать с баланса
    player.balance.depositBalance -= rebuyAmount;
    await AppDataSource.getRepository('PlayerBalance').save(player.balance);

    // Создать операцию
    const operation = this.operationRepository.create({
      playerProfile: player,
      operationType: 'REBUY',
      amount: rebuyAmount,
    });

    return this.operationRepository.save(operation);
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

    // Проверка баланса
    if (!player.balance || player.balance.depositBalance < amount) {
      throw new Error('Insufficient balance for addon');
    }

    // Списать с баланса
    player.balance.depositBalance -= amount;
    await AppDataSource.getRepository('PlayerBalance').save(player.balance);

    // Создать операцию
    const operation = this.operationRepository.create({
      playerProfile: player,
      operationType: 'ADDON',
      amount,
    });

    return this.operationRepository.save(operation);
  }

  /**
   * Выбытие игрока с записью результата
   */
  async eliminatePlayer(
    tournamentId: string,
    playerProfileId: string,
    finishPosition: number,
    prizeAmount?: number
  ): Promise<TournamentResult> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerProfileId },
      relations: ['balance'],
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Исключить игрока со стола
    await this.seatingService.eliminatePlayer(playerProfileId, finishPosition);

    // Создать результат
    const result = this.resultRepository.create({
      tournament,
      player,
      finishPosition,
      prizeAmount: prizeAmount || 0,
      isFinalTable: finishPosition <= 9,
    });

    const savedResult = await this.resultRepository.save(result);

    // Если есть призовые - начислить на баланс
    if (prizeAmount && prizeAmount > 0 && player.balance) {
      player.balance.depositBalance += prizeAmount;
      await AppDataSource.getRepository('PlayerBalance').save(player.balance);
    }

    return savedResult;
  }

  /**
   * Перейти на следующий уровень
   */
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

  /**
   * Получить текущий уровень турнира
   */
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
}
