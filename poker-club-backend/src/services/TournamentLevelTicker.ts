import { AppDataSource } from '../config/database';
import { Tournament } from '../models/Tournament';
import { TournamentLiveState } from '../models/TournamentLiveState';
import { In } from 'typeorm';
import { LiveStateService } from './LiveStateService';
import { LiveTournamentService } from './LiveTournamentService';
import { broadcastLevelChange, broadcastTimerTick } from '../websocket';
import { redisClient } from '../config/redis';
import { io } from '../app';

const TICK_MS_ACTIVE = 1000;   // 1 сек когда есть активные турниры
const TICK_MS_IDLE = 5000;     // 5 сек когда нет — меньше нагрузки на БД
const ACTIVE_IDS_CACHE_TTL = 5; // кеш ID активных турниров (сек)

const ACTIVE_IDS_KEY = 'tournament:live:active_ids';

/**
 * Фоновый процесс: каждую секунду уменьшает levelRemainingTimeSeconds в Redis.
 * БД — только при смене уровня и синхронизации. Снижает нагрузку на БД.
 */
export function startTournamentLevelTicker(): void {
  const tournamentRepo = AppDataSource.getRepository(Tournament);
  const liveStateRepo = AppDataSource.getRepository(TournamentLiveState);
  const liveStateService = new LiveStateService();
  const liveTournamentService = new LiveTournamentService();

  let intervalMs = TICK_MS_IDLE;

  const getActiveTournamentIds = async (): Promise<{ id: string }[]> => {
    if (redisClient.isOpen) {
      try {
        const cached = await redisClient.get(ACTIVE_IDS_KEY);
        if (cached) {
          const ids = JSON.parse(cached) as string[];
          return ids.map((id) => ({ id }));
        }
      } catch {
        // ignore parse error, fall through to DB
      }
    }
    const running = await tournamentRepo.find({
      where: { status: In(['RUNNING', 'LATE_REG']) },
      select: ['id'],
    });
    if (redisClient.isOpen && running.length > 0) {
      try {
        await redisClient.set(
          ACTIVE_IDS_KEY,
          JSON.stringify(running.map((t) => t.id)),
          { EX: ACTIVE_IDS_CACHE_TTL }
        );
      } catch {
        // ignore
      }
    }
    return running;
  };

  const tick = async (): Promise<number> => {
    try {
      const running = await getActiveTournamentIds();

      for (const t of running) {
        try {
          let timer = await liveStateService.getTimer(t.id);
          if (!timer) {
            const liveState = await liveStateRepo.findOne({
              where: { tournament: { id: t.id } },
              relations: ['tournament'],
            });
            if (!liveState) continue;
            timer = {
              levelRemainingTimeSeconds: liveState.levelRemainingTimeSeconds,
              currentLevelNumber: liveState.currentLevelNumber,
              isPaused: liveState.isPaused,
            };
            await liveStateService.setTimer(t.id, timer);
          }

          if (timer.isPaused) continue;

          const nextRemaining = timer.levelRemainingTimeSeconds - 1;

          if (nextRemaining <= 0) {
            try {
              const { tournament, currentLevel } = await liveTournamentService.moveToNextLevel(t.id);
              const durationSeconds = (currentLevel?.durationMinutes ?? (currentLevel?.isBreak ? 5 : 20)) * 60;

              await liveStateService.updateLiveState(t.id, {
                currentLevelNumber: tournament.currentLevelNumber,
                levelRemainingTimeSeconds: durationSeconds,
              });

              broadcastLevelChange(io, t.id, {
                levelNumber: tournament.currentLevelNumber,
                durationSeconds,
              });
            } catch (err) {
              console.error(`[Ticker] Advance level failed for tournament ${t.id}:`, err);
            }
          } else {
            const nextTimer = {
              levelRemainingTimeSeconds: nextRemaining,
              currentLevelNumber: timer.currentLevelNumber,
              isPaused: false,
            };
            await liveStateService.setTimer(t.id, nextTimer);
            broadcastTimerTick(io, t.id, nextTimer);
          }
        } catch (err) {
          console.error(`[Ticker] Error for tournament ${t.id}:`, err);
        }
      }
      return running.length;
    } catch (err) {
      console.error('[Ticker] Error:', err);
      return 0;
    }
  };

  const schedule = () => {
    tick().then((count) => {
      intervalMs = count > 0 ? TICK_MS_ACTIVE : TICK_MS_IDLE;
      setTimeout(schedule, intervalMs);
    });
  };

  schedule();
}

