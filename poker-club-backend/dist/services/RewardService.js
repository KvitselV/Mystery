"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardService = void 0;
const database_1 = require("../config/database");
const Reward_1 = require("../models/Reward");
class RewardService {
    constructor() {
        this.rewardRepository = database_1.AppDataSource.getRepository(Reward_1.Reward);
    }
    async create(data) {
        const reward = this.rewardRepository.create({
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl,
            type: data.type,
            isActive: true,
        });
        return await this.rewardRepository.save(reward);
    }
    async getRewards(filters) {
        const where = {};
        if (filters?.isActive !== undefined)
            where.isActive = filters.isActive;
        const [rewards, total] = await this.rewardRepository.findAndCount({
            where,
            order: { name: 'ASC' },
            take: filters?.limit ?? 50,
            skip: filters?.offset ?? 0,
        });
        return { rewards, total };
    }
    async getById(id) {
        const reward = await this.rewardRepository.findOne({ where: { id } });
        if (!reward)
            throw new Error('Reward not found');
        return reward;
    }
    async update(id, data) {
        const reward = await this.rewardRepository.findOne({ where: { id } });
        if (!reward)
            throw new Error('Reward not found');
        if (data.name !== undefined)
            reward.name = data.name;
        if (data.description !== undefined)
            reward.description = data.description;
        if (data.imageUrl !== undefined)
            reward.imageUrl = data.imageUrl;
        if (data.type !== undefined)
            reward.type = data.type;
        if (data.isActive !== undefined)
            reward.isActive = data.isActive;
        return await this.rewardRepository.save(reward);
    }
    async delete(id) {
        const reward = await this.rewardRepository.findOne({ where: { id } });
        if (!reward)
            throw new Error('Reward not found');
        await this.rewardRepository.remove(reward);
    }
}
exports.RewardService = RewardService;
//# sourceMappingURL=RewardService.js.map