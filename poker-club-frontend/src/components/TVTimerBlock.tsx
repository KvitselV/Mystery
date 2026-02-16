import { useLevelCountdown } from '../hooks/useLevelCountdown';
import type { LiveState } from '../api';

function formatHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatMaxLimit(max: number | undefined, available: boolean): string {
  if (!available) return '—';
  const m = max ?? 0;
  if (m === 0) return '∞';
  return String(m);
}

function Cell({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-0 min-w-0 overflow-hidden tv-liquid-glass ${className}`}>
      {children}
    </div>
  );
}

export function TVTimerBlock({
  liveState,
  onRefresh,
  embedded = false,
}: {
  liveState: LiveState;
  onRefresh?: () => void;
  embedded?: boolean;
}) {
  const displaySeconds = useLevelCountdown(
    liveState.levelRemainingTimeSeconds,
    liveState.isPaused ?? false,
    onRefresh ?? (() => {})
  );
  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;

  const nextBreakSeconds = liveState.nextBreakTime
    ? Math.max(0, Math.floor((new Date(liveState.nextBreakTime).getTime() - Date.now()) / 1000))
    : null;

  const s = embedded
    ? {
        label: 'clamp(10px, 1.8vmin, 24px)',
        value: 'clamp(14px, 2.8vmin, 36px)',
        name: 'clamp(14px, 2.5vmin, 32px)',
        timer: 'clamp(48px, 10vmin, 120px)',
        blinds: 'clamp(12px, 2.2vmin, 28px)',
        gap: 'clamp(4px, 0.6vmin, 10px)',
        mainGap: 'clamp(4px, 0.8vmin, 12px)',
      }
    : {
        label: 'clamp(18px, 3.5vmin, 48px)',
        value: 'clamp(28px, 7vmin, 110px)',
        name: 'clamp(24px, 5vmin, 96px)',
        timer: 'clamp(140px, 28vmin, 520px)',
        blinds: 'clamp(22px, 4.5vmin, 80px)',
        gap: 'clamp(6px, 1vmin, 16px)',
        mainGap: 'clamp(8px, 1.5vmin, 24px)',
      };

  const isBreak = liveState.currentLevel?.isBreak ?? false;
  const breakLabel =
    liveState.currentLevel?.breakName ||
    (liveState.currentLevel?.breakType === 'ADDON'
      ? 'Аддонный перерыв'
      : liveState.currentLevel?.breakType === 'END_LATE_REG'
        ? 'Конец поздней регистрации'
        : liveState.currentLevel?.breakType === 'END_LATE_REG_AND_ADDON'
          ? 'Конец поздней регистрации и аддон'
          : 'Перерыв');

  const content = (
    <div
      className={`text-zinc-100 grid overflow-hidden w-full min-w-0 ${embedded ? '' : 'h-full'}`}
      style={{
        gridTemplateColumns: '1fr 2fr 1fr',
        gap: s.mainGap,
        minHeight: embedded ? 280 : undefined,
        height: embedded ? '100%' : '100%',
      }}
    >
      {/* Left column */}
      <div
        className="grid overflow-hidden min-w-0"
        style={{ gridTemplateRows: '1fr 1fr 1fr 1fr 1fr', gap: s.gap }}
      >
        <Cell className="flex flex-col justify-center pl-4 md:pl-6 min-h-0">
          <span className="text-zinc-400" style={{ fontSize: s.label }}>Level</span>
          <span className="font-bold mt-1 text-zinc-100" style={{ fontSize: s.value }}>{liveState.currentLevelNumber}</span>
        </Cell>
        <Cell className="flex flex-col justify-center pl-4 md:pl-6 min-h-0">
          <span className="text-zinc-400" style={{ fontSize: s.label }}>Player</span>
          <span className="font-bold mt-1 text-zinc-100" style={{ fontSize: s.value }}>
            {liveState.playersCount} / {liveState.totalParticipants ?? liveState.playersCount}
          </span>
        </Cell>
        <Cell className="flex flex-col justify-center pl-4 md:pl-6 min-h-0">
          <span className="text-zinc-400" style={{ fontSize: s.label }}>Entries</span>
          <span className="font-bold mt-1 text-zinc-100" style={{ fontSize: s.value }}>
            {liveState.entriesCount ?? liveState.playersCount}
          </span>
        </Cell>
        <Cell className="flex flex-col justify-center pl-4 md:pl-6 min-h-0">
          <span className="text-zinc-400" style={{ fontSize: s.label }}>Average Stack</span>
          <span className="font-bold mt-1 text-zinc-100" style={{ fontSize: s.value }}>
            {(liveState.averageStack ?? 0).toLocaleString('ru-RU')}
          </span>
        </Cell>
        <Cell className="flex flex-col justify-center pl-4 md:pl-6 min-h-0">
          <span className="text-zinc-400" style={{ fontSize: s.label }}>Total Chips</span>
          <span className="font-bold mt-1 text-zinc-100" style={{ fontSize: s.value }}>
            {(liveState.totalChipsInPlay ?? 0).toLocaleString('ru-RU')}
          </span>
        </Cell>
      </div>

      {/* Center column */}
      <div
        className="grid overflow-hidden min-w-0"
        style={{ gridTemplateRows: '1fr 2.5fr 0.75fr 0.75fr', gap: s.gap }}
      >
        <Cell className="flex items-center justify-center min-h-0">
          <span className="font-semibold text-zinc-100 px-2 md:px-4" style={{ fontSize: s.name }}>
            {liveState.tournamentName || 'Name'}
          </span>
        </Cell>
        <Cell className="flex flex-col items-center justify-center min-h-0 py-2 md:py-4">
          <span
            className={`font-bold font-mono tabular-nums leading-none ${
              liveState.isPaused ? 'text-amber-400' : 'text-amber-400'
            }`}
            style={{ fontSize: s.timer, lineHeight: 1 }}
          >
            {liveState.isPaused
              ? 'ПАУЗА'
              : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
          </span>
        </Cell>
        <Cell className="flex flex-row justify-center items-center gap-x-3 min-h-0 min-w-0 px-2 overflow-hidden">
          <span className="text-zinc-100 text-center break-words" style={{ fontSize: s.blinds }}>
            Blinds:{' '}
            {liveState.currentLevel
              ? `${liveState.currentLevel.smallBlind.toLocaleString('ru-RU')}/${liveState.currentLevel.bigBlind.toLocaleString('ru-RU')}`
              : '—'}
          </span>
          <span className="text-zinc-100 text-center break-words" style={{ fontSize: s.blinds }}>
            Ante:{' '}
            {liveState.currentLevel?.ante
              ? liveState.currentLevel.ante.toLocaleString('ru-RU')
              : '0'}
          </span>
        </Cell>
        <Cell className="flex items-center justify-center min-h-0 min-w-0 px-2 md:px-4 overflow-hidden">
          <span className="text-zinc-100 text-center break-words w-full block" style={{ fontSize: s.blinds }}>
            Next Level:{' '}
            {liveState.nextLevel
              ? `${liveState.nextLevel.smallBlind.toLocaleString('ru-RU')}/${liveState.nextLevel.bigBlind.toLocaleString('ru-RU')}(${(liveState.nextLevel.ante ?? 0).toLocaleString('ru-RU')})`
              : '—'}
          </span>
        </Cell>
      </div>

      {/* Right column */}
      <div
        className="grid overflow-hidden min-w-0"
        style={{ gridTemplateRows: '1fr 1fr 1fr 1fr 1fr', gap: s.gap }}
      >
        <Cell className="flex flex-col justify-center pl-4 md:pl-6 min-h-0">
          <span className="text-zinc-400" style={{ fontSize: s.label }}>Next Break:</span>
          <span className="font-bold font-mono mt-1 text-zinc-100" style={{ fontSize: s.value }}>
            {nextBreakSeconds != null ? formatHMS(nextBreakSeconds) : '—'}
          </span>
        </Cell>
        <Cell className="flex flex-col justify-center pl-4 md:pl-6 min-h-0">
          <span className="text-zinc-400" style={{ fontSize: s.label }}>Late Reg</span>
          <span className="font-bold font-mono mt-1 text-zinc-100" style={{ fontSize: s.value }}>—</span>
        </Cell>
        <div className="row-span-3 flex flex-col justify-center pl-4 md:pl-6 min-h-0 min-w-0 overflow-hidden tv-liquid-glass">
          <div className="text-zinc-200 space-y-2" style={{ fontSize: embedded ? 'clamp(11px, 2vmin, 24px)' : 'clamp(20px, 4vmin, 72px)' }}>
            {liveState.tournament ? (
              <>
                <div>Starting stack: {(liveState.tournament.startingStack / 1000).toFixed(0)}k</div>
                <div>Rebuy stack: {(liveState.tournament.rebuyChips / 1000).toFixed(0)}k</div>
                <div>Add-on: {(liveState.tournament.addonChips / 1000).toFixed(0)}k</div>
                <div>Rebuys: {formatMaxLimit(liveState.tournament.maxRebuys, !!liveState.tournament.rebuyChips)}</div>
                <div>Add-ons: {formatMaxLimit(liveState.tournament.maxAddons, !!liveState.tournament.addonChips)}</div>
              </>
            ) : (
              <div className="text-zinc-500">—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const timerContent = (
    <>
      {content}
      {isBreak && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-10"
          style={{ borderRadius: embedded ? 12 : 0 }}
        >
          <div className="tv-liquid-glass px-8 py-6 text-center max-w-2xl">
            <p className="text-amber-400 font-bold mb-2" style={{ fontSize: embedded ? 'clamp(20px, 4vmin, 48px)' : 'clamp(32px, 6vmin, 96px)' }}>
              Начался перерыв
            </p>
            <p className="text-zinc-300" style={{ fontSize: embedded ? 'clamp(14px, 2.5vmin, 28px)' : 'clamp(20px, 4vmin, 48px)' }}>
              {breakLabel}
            </p>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="w-full rounded-xl overflow-hidden relative" style={{ minHeight: 280 }}>
        <div className="h-full p-3 md:p-4">
          {timerContent}
        </div>
      </div>
    );
  }

  return <div className="relative w-full h-full">{timerContent}</div>;
}
