"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementController = void 0;
const AchievementService_1 = require("../services/AchievementService");
const achievementService = new AchievementService_1.AchievementService();
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
     * POST /achievements/seed — только ADMIN (requireRole в роуте)
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
}
exports.AchievementController = AchievementController;
//# sourceMappingURL=AchievementController.js.map