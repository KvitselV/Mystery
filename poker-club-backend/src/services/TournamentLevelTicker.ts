import { AppDataSource } from '../config/database';
import { Tournament } from '../models/Tournament';
import { TournamentLiveState } from '../models/TournamentLiveState';
import { In } from 'typeorm';
import { LiveStateService } from './LiveStateService';
import { LiveTournamentService } from './LiveTournamentService';
import { broadcastLevelChange } from '../websocket';
import { io } from '../app';

/**
 * Фоновый процесс: каждую секунду уменьшает levelRemainingTimeSeconds
 * для активных турниров. При достижении 0 — автоматический переход на следующий уровень.
 */
export function startTournamentLevelTicker(): void {
  const tournamentRepo = AppDataSource.getRepository(Tournament);
  const liveStateRepo = AppDataSource.getRepository(TournamentLiveState);
  const liveStateService = new LiveStateService();
  const liveTournamentService = new LiveTournamentService();

  setInterval(async () => {
    try {
      const running = await tournamentRepo.find({
        where: { status: In(['RUNNING', 'LATE_REG']) },
        select: ['id'],
      });

      for (const t of running) {
        try {
          const liveState = await liveStateRepo.findOne({
            where: { tournament: { id: t.id } },
            relations: ['tournament'],
          });

          if (!liveState || liveState.isPaused) continue;

          const nextRemaining = liveState.levelRemainingTimeSeconds - 1;

          if (nextRemaining <= 0) {
            // Переход на следующий уровень
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
            await liveStateService.updateLiveState(t.id, {
              levelRemainingTimeSeconds: nextRemaining,
            });
          }
        } catch (err) {
          console.error(`[Ticker] Error for tournament ${t.id}:`, err);
        }
      }
    } catch (err) {
      console.error('[Ticker] Error:', err);
    }
  }, 1000);
}
