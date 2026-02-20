"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementController = void 0;
const AchievementService_1 = require("../services/AchievementService");
const database_1 = require("../config/database");
const PlayerProfile_1 = require("../models/PlayerProfile");
const achievementService = new AchievementService_1.AchievementService();
const profileRepo = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
function canAccessUser(req, userId) {
    if (!req.user)
        return false;
    return req.user.userId === userId || req.user.role === 'ADMIN';
}
class AchievementController {
    static async getAllTypes(req, res) {
        try {
            const types = await achievementService.getAllAchievementTypes();
            res.json(types);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch achievement types' });
        }
    }
    static async getUserAchievements(req, res) {
        try {
            const userId = req.params.userId;
            if (!canAccessUser(req, userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const achievements = await achievementService.getUserAchievements(userId);
            res.json(achievements);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch user achievements' });
        }
    }
    static async getUserProgress(req, res) {
        try {
            const userId = req.params.userId;
            if (!canAccessUser(req, userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const progress = await achievementService.getUserAchievementProgress(userId);
            res.json(progress);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch user achievement progress' });
        }
    }
    /**
     * POST /achievements/check — только ADMIN (requireRole в роуте)
     */
    static async checkAchievements(req, res) {
        try {
            const userId = req.params.userId;
            const tournamentId = req.params.tournamentId;
            const granted = await achievementService.checkAndGrantAchievements(userId, tournamentId);
            res.json({
                message: `Granted ${granted.length} achievement(s)`,
                achievements: granted,
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to check achievements' });
        }
    }
    /**
     * POST /achievements/seed — только ADMIN
     */
    static async seedTypes(req, res) {
        try {
            await achievementService.seedAchievementTypes();
            res.json({ message: 'Achievement types seeded successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to seed achievement types' });
        }
    }
    /**
     * POST /achievements/types — создать тип достижения (только ADMIN)
     */
    static async createType(req, res) {
        try {
            const { name, description, icon, iconUrl, statisticType, targetValue, targetPosition, conditionDescription } = req.body;
            if (!name || !description) {
                res.status(400).json({ error: 'name and description are required' });
                return;
            }
            const type = await achievementService.createAchievementType({
                name,
                description,
                icon,
                iconUrl,
                statisticType,
                targetValue,
                targetPosition: targetPosition != null ? Number(targetPosition) : undefined,
                conditionDescription,
            });
            res.status(201).json(type);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create achievement type' });
        }
    }
    /**
     * DELETE /achievements/instances/:id — отозвать достижение (только ADMIN)
     */
    static async revokeInstance(req, res) {
        try {
            const instanceId = req.params.id;
            await achievementService.revokeAchievement(instanceId);
            res.json({ message: 'Achievement revoked' });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to revoke achievement' });
        }
    }
    /**
     * PATCH /achievements/user/:userId/pins — установить закреплённые достижения (до 4)
     */
    static async setPins(req, res) {
        try {
            const userId = req.params.userId;
            if (!canAccessUser(req, userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const { achievementTypeIds } = req.body;
            if (!Array.isArray(achievementTypeIds)) {
                res.status(400).json({ error: 'achievementTypeIds must be an array' });
                return;
            }
            await achievementService.setPinnedAchievements(userId, achievementTypeIds);
            res.json({ message: 'Pins updated' });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to set pins' });
        }
    }
    /**
     * GET /achievements/profile/:playerProfileId — получить достижения по playerProfileId (доступно всем авторизованным)
     */
    static async getAchievementsByPlayerProfileId(req, res) {
        try {
            const playerProfileId = req.params.playerProfileId;
            const profile = await profileRepo.findOne({
                where: { id: playerProfileId },
                relations: ['user'],
            });
            if (!profile) {
                res.status(404).json({ error: 'Player profile not found' });
                return;
            }
            const achievements = await achievementService.getUserAchievements(profile.user.id);
            res.json(achievements);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch achievements' });
        }
    }
}
exports.AchievementController = AchievementController;
//# sourceMappingURL=AchievementController.js.map