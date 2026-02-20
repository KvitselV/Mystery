import { AchievementInstance } from './AchievementInstance';
export declare enum AchievementCode {
    FIRST_TOURNAMENT = "FIRST_TOURNAMENT",
    FIVE_TOURNAMENTS = "FIVE_TOURNAMENTS",
    TEN_TOURNAMENTS = "TEN_TOURNAMENTS",
    FINAL_TABLE = "FINAL_TABLE",
    WIN = "WIN",
    HOT_STREAK = "HOT_STREAK",
    SERIES_WINNER = "SERIES_WINNER"
}
/** Тип статистики для настраиваемых достижений */
export declare enum AchievementStatisticType {
    TOURNAMENTS_PLAYED = "TOURNAMENTS_PLAYED",
    WINS = "WINS",
    CONSECUTIVE_WINS = "CONSECUTIVE_WINS",
    /** Конкретное место N раз подряд: targetPosition = 1..N (место), 0 = последнее место; targetValue = кол-во раз */
    CONSECUTIVE_POSITION = "CONSECUTIVE_POSITION",
    SERIES_WINS = "SERIES_WINS",
    FINAL_TABLE = "FINAL_TABLE",
    ITM_STREAK = "ITM_STREAK"
}
export declare class AchievementType {
    id: string;
    code?: string;
    name: string;
    description: string;
    /** Base64 data URL или URL изображения иконки */
    iconUrl?: string;
    /** Эмодзи или идентификатор иконки (например: 🏆, trophy) */
    icon?: string;
    /** Тип статистики для настраиваемых достижений */
    statisticType?: string;
    /** Целевое значение (например: 2 победы подряд, или кол-во раз подряд для CONSECUTIVE_POSITION) */
    targetValue: number;
    /** Место для CONSECUTIVE_POSITION: 1=1-е место, 2=2-е место, ..., 0=последнее место (вылетел первым) */
    targetPosition?: number;
    /** Условие достижения (отображается при наведении) */
    conditionDescription?: string;
    sortOrder: number;
    createdAt: Date;
    instances: AchievementInstance[];
}
//# sourceMappingURL=AchievementType.d.ts.map