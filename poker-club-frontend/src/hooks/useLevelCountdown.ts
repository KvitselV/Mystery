import { useState, useEffect, useRef } from 'react';

/**
 * Обратный отсчёт времени уровня в реальном времени.
 * При достижении 0 вызывает onLevelEnd (для обновления данных).
 */
export function useLevelCountdown(
  levelRemainingTimeSeconds: number | undefined,
  isPaused: boolean,
  onLevelEnd?: () => void
): number {
  const [displaySeconds, setDisplaySeconds] = useState(levelRemainingTimeSeconds ?? 0);
  const receivedAtRef = useRef(Date.now());
  const prevLevelRef = useRef(levelRemainingTimeSeconds);
  const onLevelEndRef = useRef(onLevelEnd);
  onLevelEndRef.current = onLevelEnd;

  // Сброс при смене уровня (новые данные с сервера)
  useEffect(() => {
    if (levelRemainingTimeSeconds !== prevLevelRef.current) {
      prevLevelRef.current = levelRemainingTimeSeconds;
      receivedAtRef.current = Date.now();
      setDisplaySeconds(levelRemainingTimeSeconds ?? 0);
    }
  }, [levelRemainingTimeSeconds]);

  useEffect(() => {
    if (isPaused || levelRemainingTimeSeconds == null) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - receivedAtRef.current) / 1000);
      const remaining = Math.max(0, (levelRemainingTimeSeconds ?? 0) - elapsed);
      setDisplaySeconds(remaining);
      if (remaining <= 0) {
        onLevelEndRef.current?.();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [levelRemainingTimeSeconds, isPaused]);

  return displaySeconds;
}
