import { AppDataSource } from '../config/database';
import { redisClient } from '../config/redis';
import { TournamentLiveState } from '../models/TournamentLiveState';
import { Tournament } from '../models/Tournament';
import { TableSeat } from '../models/TableSeat';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { PlayerOperation } from '../models/PlayerOperation';
import { io } from '../app';
import { broadcastLiveStateUpdate, broadcastLevelChange } from '../websocket';

export interface LiveStateDto {
  tournamentId: string;
  tournamentName: string;
  currentLevelNumber: number;
  levelRemainingTimeSeconds: number;
  playersCount: number;
  totalParticipants: number;
  totalEntries: number;
  totalChipsInPlay: number;
  averageStack: number;
  isPaused: boolean;
  liveStatus: string;
  nextBreakTime: Date | null;
  updatedAt: Date;
}

export class LiveStateService {
  private liveStateRepository = AppDataSource.getRepository(TournamentLiveState);
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private seatRepository = AppDataSource.getRepository(TableSeat);
  private registrationRepository = AppDataSource.getRepository(TournamentRegistration);
  private operationRepository = AppDataSource.getRepository(PlayerOperation);

  // ---------- Redis helpers ----------

  private getLiveStateKey(tournamentId: string): string {
    return `tournament:live:${tournamentId}`;
  }

  private async getFromCache(tournamentId: string): Promise<LiveStateDto | null> {
    if (!redisClient.isOpen) return null;

    const key = this.getLiveStateKey(tournamentId);
    const raw = await redisClient.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as LiveStateDto;
    } catch {
      return null;
    }
  }

  private async saveToCache(tournamentId: string, dto: LiveStateDto): Promise<void> {
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
        levelRemainingTimeSeconds: 1200,
        playersCount: 0,
        totalParticipants: 0,
        totalEntries: 0,
        totalChipsInPlay: 0,
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
   * Пересчитать статистику: активные участники, всего участников, входы, фишки в игре, средний стек
   */
  async recalculateStats(tournamentId: string): Promise<TournamentLiveState> {
    const liveState = await this.getOrCreateLiveState(tournamentId);

    const activeSeats = await this.seatRepository.find({
      where: {
        table: { tournament: { id: tournamentId } },
        isOccupied: true,
        status: 'ACTIVE',
      },
      relations: ['player'],
    });
    const activePlayerIds = [...new Set(activeSeats.map((s) => s.player?.id).filter(Boolean))] as string[];

    const totalParticipants = await this.registrationRepository.count({
      where: { tournament: { id: tournamentId } },
    });

    const [rebuyCount, addonCount] = await Promise.all([
      this.operationRepository.count({
        where: { tournament: { id: tournamentId }, operationType: 'REBUY' },
      }),
      this.operationRepository.count({
        where: { tournament: { id: tournamentId }, operationType: 'ADDON' },
      }),
    ]);
    const totalEntries = totalParticipants + rebuyCount;

    // Общее количество фишек = бай-ины + ребаи + аддоны. Не уменьшается при вылете — вылетевший отдал фишки победителю.
    const startingStack = liveState.tournament?.startingStack ?? 0;
    const rebuyChips = liveState.tournament?.rebuyChips ?? 0;
    const addonChips = liveState.tournament?.addonChips ?? 0;
    const totalChipsInPlay = totalParticipants * startingStack + rebuyCount * rebuyChips + addonCount * addonChips;

    const playersCount = activePlayerIds.length;
    const divisor = playersCount > 0 ? playersCount : totalParticipants;
    const averageStack = divisor > 0 ? Math.floor(totalChipsInPlay / divisor) : (liveState.tournament?.startingStack ?? 0);

    liveState.playersCount = playersCount;
    liveState.totalParticipants = totalParticipants;
    liveState.totalEntries = totalEntries;
    liveState.totalChipsInPlay = totalChipsInPlay;
    liveState.averageStack = averageStack;
    liveState.updatedAt = new Date();

    const updated = await this.liveStateRepository.save(liveState);

    const dto = this.formatLiveState(updated);
    await this.saveToCache(tournamentId, dto);
    broadcastLiveStateUpdate(io, tournamentId, dto);

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
  async getLiveState(tournamentId: string): Promise<LiveStateDto | null> {
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
  async getRebuyAndAddonCounts(tournamentId: string): Promise<{ rebuyCount: number; addonCount: number }> {
    const [rebuyCount, addonCount] = await Promise.all([
      this.operationRepository.count({
        where: { tournament: { id: tournamentId }, operationType: 'REBUY' },
      }),
      this.operationRepository.count({
        where: { tournament: { id: tournamentId }, operationType: 'ADDON' },
      }),
    ]);
    return { rebuyCount, addonCount };
  }

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
  private formatLiveState(liveState: TournamentLiveState): LiveStateDto {
    return {
      tournamentId: liveState.tournament.id,
      tournamentName: liveState.tournament.name,
      currentLevelNumber: liveState.currentLevelNumber,
      levelRemainingTimeSeconds: liveState.levelRemainingTimeSeconds,
      playersCount: liveState.playersCount,
      totalParticipants: liveState.totalParticipants,
      totalEntries: liveState.totalEntries,
      totalChipsInPlay: liveState.totalChipsInPlay,
      averageStack: liveState.averageStack,
      isPaused: liveState.isPaused,
      liveStatus: liveState.liveStatus,
      nextBreakTime: liveState.nextBreakTime ?? null,
      updatedAt: liveState.updatedAt,
    };
  }
}
