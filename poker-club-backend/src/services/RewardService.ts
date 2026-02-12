import { AppDataSource } from '../config/database';
import { Reward } from '../models/Reward';

export class RewardService {
  private rewardRepository = AppDataSource.getRepository(Reward);

  async create(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    type?: string;
  }): Promise<Reward> {
    const reward = this.rewardRepository.create({
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      type: data.type,
      isActive: true,
    });
    return await this.rewardRepository.save(reward);
  }

  async getRewards(filters?: {
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ rewards: Reward[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const [rewards, total] = await this.rewardRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });
    return { rewards, total };
  }

  async getById(id: string): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) throw new Error('Reward not found');
    return reward;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string;
      type?: string;
      isActive?: boolean;
    }
  ): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) throw new Error('Reward not found');
    if (data.name !== undefined) reward.name = data.name;
    if (data.description !== undefined) reward.description = data.description;
    if (data.imageUrl !== undefined) reward.imageUrl = data.imageUrl;
    if (data.type !== undefined) reward.type = data.type;
    if (data.isActive !== undefined) reward.isActive = data.isActive;
    return await this.rewardRepository.save(reward);
  }

  async delete(id: string): Promise<void> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) throw new Error('Reward not found');
    await this.rewardRepository.remove(reward);
  }
}
