import { AppDataSource } from '../config/database';
import { redisClient } from '../config/redis';
import { TournamentLiveState } from '../models/TournamentLiveState';
import { Tournament } from '../models/Tournament';
import { TableSeat } from '../models/TableSeat';
import { io } from '../app';
import { broadcastLiveStateUpdate, broadcastLevelChange } from '../websocket';

export class LiveStateService {
  private liveStateRepository = AppDataSource.getRepository(TournamentLiveState);
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private seatRepository = AppDataSource.getRepository(TableSeat);

  // ---------- Redis helpers ----------

  private getLiveStateKey(tournamentId: string): string {
    return `tournament:live:${tournamentId}`;
  }

  private async getFromCache(tournamentId: string): Promise<any | null> {
    if (!redisClient.isOpen) return null;

    const key = this.getLiveStateKey(tournamentId);
    const raw = await redisClient.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private async saveToCache(tournamentId: string, dto: any): Promise<void> {
    if (!redisClient.isOpen) return;

    const key = this.getLiveStateKey(tournamentId);
    await redisClient.set(key, JSON.stringify(dto), {
      EX: 60, // TTL: 60 сек, можешь поменять на 300
    });
  }

  private async deleteFromCache(tournamentId: string): Promise<void> {
    if (!redisClient.isOpen) return;
    await redisClient.del(this.getLiveStateKey(tournamentId));
  }

  // ---------- Основная логика ----------

  /**
   * Создать или получить Live State для турнира
   * + попробовать взять DTO из Redis
   */
  async getOrCreateLiveState(tournamentId: string): Promise<TournamentLiveState> {
    // NOTE: этот метод по-прежнему возвращает entity, но
    // кэшируем мы уже форматированный DTO в местах обновления

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
   * + обновить Redis + отправить WebSocket
   */
  async updateLiveState(
    tournamentId: string,
    updates: Partial<TournamentLiveState>
  ): Promise<TournamentLiveState> {
    const liveState = await this.getOrCreateLiveState(tournamentId);

    Object.assign(liveState, updates);
    liveState.updatedAt = new Date();

    const updated = await this.liveStateRepository.save(liveState);

    const dto = this.formatLiveState(updated);
    await this.saveToCache(tournamentId, dto);        // 👈 кэш
    broadcastLiveStateUpdate(io, tournamentId, dto);  // 🔥 вебсокет

    return updated;
  }

  /**
   * Пересчитать статистику (количество игроков, средний стек)
   */
  async recalculateStats(tournamentId: string): Promise<TournamentLiveState> {
    const liveState = await this.getOrCreateLiveState(tournamentId);

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

    const dto = this.formatLiveState(updated);
    await this.saveToCache(tournamentId, dto);        // 👈 кэш
    broadcastLiveStateUpdate(io, tournamentId, dto);  // 🔥 вебсокет

    console.log(`📊 Stats recalculated for tournament ${tournamentId}: ${activeSeats} players`);

    return updated;
  }

  async pauseTournament(tournamentId: string): Promise<TournamentLiveState> {
    const updated = await this.updateLiveState(tournamentId, {
      isPaused: true,
      liveStatus: 'PAUSED',
    });

    console.log(`⏸️ Tournament ${tournamentId} paused`);
    return updated;
  }

  async resumeTournament(tournamentId: string): Promise<TournamentLiveState> {
    const updated = await this.updateLiveState(tournamentId, {
      isPaused: false,
      liveStatus: 'RUNNING',
    });

    console.log(`▶️ Tournament ${tournamentId} resumed`);
    return updated;
  }

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

  async advanceToNextLevel(tournamentId: string): Promise<TournamentLiveState> {
    const liveState = await this.getOrCreateLiveState(tournamentId);
    const nextLevel = liveState.currentLevelNumber + 1;

    const updated = await this.updateLiveState(tournamentId, {
      currentLevelNumber: nextLevel,
      levelRemainingTimeSeconds: 1200,
    });

    broadcastLevelChange(io, tournamentId, {
      levelNumber: nextLevel,
      durationSeconds: 1200,
    });

    console.log(`🆙 Advanced to level ${nextLevel} in tournament ${tournamentId}`);
    return updated;
  }

  /**
   * Получить Live State
   * ⚠️ Важно: для API лучше отдавать DTO и сначала пробовать Redis
   */
  async getLiveState(tournamentId: string): Promise<any | null> {
    // 1. Сначала пробуем DTO из Redis
    const cached = await this.getFromCache(tournamentId);
    if (cached) {
      return cached;
    }

    // 2. Если нет в кэше — читаем из БД и кладём
    const liveState = await this.liveStateRepository.findOne({
      where: { tournament: { id: tournamentId } },
      relations: ['tournament'],
    });

    if (!liveState) return null;

    const dto = this.formatLiveState(liveState);
    await this.saveToCache(tournamentId, dto);

    return dto;
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

    await this.deleteFromCache(tournamentId); // 👈 чистим Redis
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
