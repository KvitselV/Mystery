/** Минимальный тип для отображения иконки достижения */
export interface AchievementIconType {
  iconUrl?: string;
  icon?: string;
  name?: string;
}

/** SVG-иконка кубка для достижений (fallback, когда нет iconUrl) */
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.078 1.34.195 1.986.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
    </svg>
  );
}

/** Иконка достижения: изображение (iconUrl) или SVG-иконка вместо эмодзи */
export function AchievementIcon({
  type,
  size = 'md',
}: {
  type: AchievementIconType;
  size?: 'sm' | 'md' | 'lg';
}) {
  const iconUrl = type.iconUrl;
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';

  if (iconUrl && (iconUrl.startsWith('data:') || iconUrl.startsWith('http') || iconUrl.startsWith('/'))) {
    return (
      <img
        src={iconUrl}
        alt={type.name ?? ''}
        className={`${sizeClass} rounded object-contain`}
        title={type.name}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex items-center justify-center text-amber-400`}
      title={type.name}
    >
      <TrophyIcon className={size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'} />
    </span>
  );
}
