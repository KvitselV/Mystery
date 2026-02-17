import { useState, useEffect, useRef } from 'react';

/**
 * Плавный обратный отсчёт. Сервер — источник истины.
 * При получении нового значения — обновляем базу; между обновлениями — локальная интерполяция.
 */
export function useLevelCountdown(
  levelRemainingTimeSeconds: number | undefined,
  isPaused: boolean
): number {
  const baseRef = useRef(levelRemainingTimeSeconds ?? 0);
  const receivedAtRef = useRef(Date.now());
  const [displaySeconds, setDisplaySeconds] = useState(levelRemainingTimeSeconds ?? 0);

  // Обновить базу при изменении значения с сервера
  useEffect(() => {
    if (levelRemainingTimeSeconds == null) return;
    baseRef.current = levelRemainingTimeSeconds;
    receivedAtRef.current = Date.now();
    setDisplaySeconds(levelRemainingTimeSeconds);
  }, [levelRemainingTimeSeconds]);

  // Плавный обратный отсчёт (интерполяция между обновлениями сервера)
  useEffect(() => {
    if (isPaused) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - receivedAtRef.current) / 1000);
      const remaining = Math.max(0, baseRef.current - elapsed);
      setDisplaySeconds(remaining);
    };

    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [isPaused]);

  return displaySeconds;
}
