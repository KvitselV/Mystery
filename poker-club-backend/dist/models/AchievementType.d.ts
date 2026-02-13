import { AchievementInstance } from './AchievementInstance';
export declare enum AchievementCode {
    FIRST_TOURNAMENT = "FIRST_TOURNAMENT",
    FIVE_TOURNAMENTS = "FIVE_TOURNAMENTS",
    TEN_TOURNAMENTS = "TEN_TOURNAMENTS",
    FINAL_TABLE = "FINAL_TABLE",
    WIN = "WIN",
    HOT_STREAK = "HOT_STREAK"
}
export declare class AchievementType {
    id: string;
    code: AchievementCode;
    name: string;
    description: string;
    iconUrl?: string;
    sortOrder: number;
    createdAt: Date;
    instances: AchievementInstance[];
}
//# sourceMappingURL=AchievementType.d.ts.map