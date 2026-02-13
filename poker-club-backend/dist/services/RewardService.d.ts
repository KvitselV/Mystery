import { Reward } from '../models/Reward';
export declare class RewardService {
    private rewardRepository;
    create(data: {
        name: string;
        description?: string;
        imageUrl?: string;
        type?: string;
    }): Promise<Reward>;
    getRewards(filters?: {
        isActive?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<{
        rewards: Reward[];
        total: number;
    }>;
    getById(id: string): Promise<Reward>;
    update(id: string, data: {
        name?: string;
        description?: string;
        imageUrl?: string;
        type?: string;
        isActive?: boolean;
    }): Promise<Reward>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=RewardService.d.ts.map