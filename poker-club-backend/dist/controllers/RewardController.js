"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardController = void 0;
const RewardService_1 = require("../services/RewardService");
const rewardService = new RewardService_1.RewardService();
class RewardController {
    static async create(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { name, description, imageUrl, type } = req.body;
            if (!name)
                return res.status(400).json({ error: 'name is required' });
            const reward = await rewardService.create({
                name,
                description,
                imageUrl,
                type,
            });
            res.status(201).json(reward);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    static async getRewards(req, res) {
        try {
            const isActiveRaw = req.query.isActive;
            const limitRaw = req.query.limit;
            const offsetRaw = req.query.offset;
            const isActive = typeof isActiveRaw === 'string' ? isActiveRaw === 'true' : undefined;
            const limit = typeof limitRaw === 'string' ? parseInt(limitRaw, 10) : 50;
            const offset = typeof offsetRaw === 'string' ? parseInt(offsetRaw, 10) : 0;
            const { rewards, total } = await rewardService.getRewards({
                isActive,
                limit,
                offset,
            });
            res.json({ rewards, total });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    static async getById(req, res) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const reward = await rewardService.getById(id);
            res.json(reward);
        }
        catch (e) {
            res.status(404).json({ error: e.message });
        }
    }
    static async update(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { name, description, imageUrl, type, isActive } = req.body;
            const reward = await rewardService.update(id, {
                name,
                description,
                imageUrl,
                type,
                isActive,
            });
            res.json(reward);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    static async delete(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            await rewardService.delete(id);
            res.json({ message: 'Reward deleted' });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
}
exports.RewardController = RewardController;
//# sourceMappingURL=RewardController.js.map