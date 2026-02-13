import { AchievementType } from './AchievementType';
import { User } from './User';
import { Tournament } from './Tournament';
export declare class AchievementInstance {
    id: string;
    userId: string;
    achievementTypeId: string;
    tournamentId?: string;
    metadata?: string;
    unlockedAt: Date;
    user: User;
    achievementType: AchievementType;
    tournament?: Tournament;
}
//# sourceMappingURL=AchievementInstance.d.ts.map