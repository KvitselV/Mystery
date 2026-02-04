import { AppDataSource } from '../config/database';
import { TournamentLiveState } from '../models/TournamentLiveState';
import { Tournament } from '../models/Tournament';
import { TableSeat } from '../models/TableSeat';
import { io } from '../app';
import { broadcastLiveStateUpdate, broadcastLevelChange } from '../websocket';

export class LiveStateService {
  private liveStateRepository = AppDataSource.getRepository(TournamentLiveState);
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private seatRepository = AppDataSource.getRepository(TableSeat);

  /**
   * Создать или получить Live State для турнира
   */
  async getOrCreateLiveState(tournamentId: string): Promise<TournamentLiveState> {
    let liveState = await this.liveStateRepository.findOne({
      where: { tournament: { id: tournamentId } },
      relations: ['tournament'],
    });

    if (!liveState) {
      const tournament = await this.tournamentRepository.findOne({
        where: { id: tournamentId },
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      liveState = this.liveStateRepository.create({
        tournament,
        currentLevelNumber: tournament.currentLevelNumber || 1,
        levelRemainingTimeSeconds: 1200, // 20 минут по умолчанию
        playersCount: 0,
        averageStack: tournament.startingStack,
        isPaused: false,
        liveStatus: 'RUNNING',
      });

      await this.liveStateRepository.save(liveState);
      console.log(`✅ Created Live State for tournament: ${tournamentId}`);
    }

    return liveState;
  }

  /**
   * Обновить Live State
   */
  async updateLiveState(
    tournamentId: string,
    updates: Partial<TournamentLiveState>
  ): Promise<TournamentLiveState> {
    const liveState = await this.getOrCreateLiveState(tournamentId);

    Object.assign(liveState, updates);
    liveState.updatedAt = new Date();

    const updated = await this.liveStateRepository.save(liveState);

    // 🔥 Отправляем WebSocket обновление
    broadcastLiveStateUpdate(io, tournamentId, this.formatLiveState(updated));

    return updated;
  }

  /**
   * Пересчитать статистику (количество игроков, средний стек)
   */
  async recalculateStats(tournamentId: string): Promise<TournamentLiveState> {
    const liveState = await this.getOrCreateLiveState(tournamentId);

    // Получить всех активных игроков
    const activeSeats = await this.seatRepository.count({
      where: {
        table: { tournament: { id: tournamentId } },
        isOccupied: true,
        status: 'ACTIVE',
      },
    });

    liveState.playersCount = activeSeats;
    liveState.updatedAt = new Date();

    const updated = await this.liveStateRepository.save(liveState);

    // 🔥 Отправляем WebSocket обновление
    broadcastLiveStateUpdate(io, tournamentId, this.formatLiveState(updated));

    console.log(`📊 Stats recalculated for tournament ${tournamentId}: ${activeSeats} players`);

    return updated;
  }

  /**
   * Поставить турнир на паузу
   */
  async pauseTournament(tournamentId: string): Promise<TournamentLiveState> {
    const updated = await this.updateLiveState(tournamentId, {
      isPaused: true,
      liveStatus: 'PAUSED',
    });

    console.log(`⏸️ Tournament ${tournamentId} paused`);

    return updated;
  }

  /**
   * Возобновить турнир
   */
  async resumeTournament(tournamentId: string): Promise<TournamentLiveState> {
    const updated = await this.updateLiveState(tournamentId, {
      isPaused: false,
      liveStatus: 'RUNNING',
    });

    console.log(`▶️ Tournament ${tournamentId} resumed`);

    return updated;
  }

  /**
   * Обновить оставшееся время на уровне
   */
  async updateLevelTime(
    tournamentId: string,
    remainingSeconds: number
  ): Promise<TournamentLiveState> {
    const updated = await this.updateLiveState(tournamentId, {
      levelRemainingTimeSeconds: remainingSeconds,
    });

    console.log(`⏱️ Level time updated for tournament ${tournamentId}: ${remainingSeconds}s`);

    return updated;
  }

  /**
   * Переключить на следующий уровень
   */
  async advanceToNextLevel(tournamentId: string): Promise<TournamentLiveState> {
    const liveState = await this.getOrCreateLiveState(tournamentId);
    const nextLevel = liveState.currentLevelNumber + 1;

    const updated = await this.updateLiveState(tournamentId, {
      currentLevelNumber: nextLevel,
      levelRemainingTimeSeconds: 1200, // Сбрасываем таймер на 20 минут
    });

    // 🔥 Отправляем отдельное событие об изменении уровня
    broadcastLevelChange(io, tournamentId, {
      levelNumber: nextLevel,
      durationSeconds: 1200,
    });

    console.log(`🆙 Advanced to level ${nextLevel} in tournament ${tournamentId}`);

    return updated;
  }

  /**
   * Получить Live State
   */
  async getLiveState(tournamentId: string): Promise<TournamentLiveState | null> {
    return this.liveStateRepository.findOne({
      where: { tournament: { id: tournamentId } },
      relations: ['tournament'],
    });
  }

  /**
   * Удалить Live State (при завершении турнира)
   */
  async deleteLiveState(tournamentId: string): Promise<void> {
    const liveState = await this.liveStateRepository.findOne({
      where: { tournament: { id: tournamentId } },
    });

    if (liveState) {
      await this.liveStateRepository.remove(liveState);
      console.log(`🗑️ Deleted Live State for tournament ${tournamentId}`);
    }
  }

  /**
   * Форматировать Live State для ответа и WebSocket
   */
  private formatLiveState(liveState: TournamentLiveState) {
    return {
      tournamentId: liveState.tournament.id,
      tournamentName: liveState.tournament.name,
      currentLevelNumber: liveState.currentLevelNumber,
      levelRemainingTimeSeconds: liveState.levelRemainingTimeSeconds,
      playersCount: liveState.playersCount,
      averageStack: liveState.averageStack,
      isPaused: liveState.isPaused,
      liveStatus: liveState.liveStatus,
      nextBreakTime: liveState.nextBreakTime,
      updatedAt: liveState.updatedAt,
    };
  }
}
