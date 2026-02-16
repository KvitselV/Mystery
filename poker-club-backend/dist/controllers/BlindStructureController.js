"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindStructureController = void 0;
const BlindStructureService_1 = require("../services/BlindStructureService");
const blindStructureService = new BlindStructureService_1.BlindStructureService();
class BlindStructureController {
    /**
     * POST /blind-structures - Создать структуру блайндов
     * Только для администраторов
     */
    static async createStructure(req, res) {
        try {
            const { name, description, levels } = req.body;
            if (!name || !levels || !Array.isArray(levels) || levels.length === 0) {
                return res.status(400).json({
                    error: 'name and levels array are required',
                });
            }
            const structure = await blindStructureService.createStructure({
                name,
                description,
                levels,
                clubId: req.user?.role === 'CONTROLLER' ? req.user.managedClubId ?? null : req.body.clubId ?? null,
            });
            res.status(201).json({
                message: 'Blind structure created successfully',
                structure: {
                    id: structure.id,
                    name: structure.name,
                    description: structure.description,
                    levelsCount: structure.levels.length,
                    levels: structure.levels.map((level) => ({
                        id: level.id,
                        levelNumber: level.levelNumber,
                        smallBlind: level.smallBlind,
                        bigBlind: level.bigBlind,
                        ante: level.ante,
                        durationMinutes: level.durationMinutes,
                        isBreak: level.isBreak,
                        breakName: level.breakName,
                    })),
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /blind-structures - Получить все структуры
     */
    static async getAllStructures(req, res) {
        try {
            const clubFilter = req.user?.role === 'CONTROLLER' ? req.user.managedClubId ?? undefined : req.query.clubId;
            const structures = await blindStructureService.getAllStructures(clubFilter || undefined);
            res.json({
                structures: structures.map((structure) => ({
                    id: structure.id,
                    name: structure.name,
                    description: structure.description,
                    levelsCount: structure.levels.length,
                    createdAt: structure.createdAt,
                })),
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /blind-structures/:id - Получить структуру по ID
     */
    static async getStructureById(req, res) {
        try {
            const structureId = req.params.id;
            const structure = await blindStructureService.getStructureById(structureId);
            res.json({
                structure: {
                    id: structure.id,
                    name: structure.name,
                    description: structure.description,
                    isActive: structure.isActive,
                    createdAt: structure.createdAt,
                    levels: structure.levels.map((level) => ({
                        id: level.id,
                        levelNumber: level.levelNumber,
                        smallBlind: level.smallBlind,
                        bigBlind: level.bigBlind,
                        ante: level.ante,
                        durationMinutes: level.durationMinutes,
                        isBreak: level.isBreak,
                        breakName: level.breakName,
                    })),
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /blind-structures/:id/levels - Добавить уровень к структуре
     * Только для администраторов
     */
    static async addLevel(req, res) {
        try {
            const structureId = req.params.id;
            const { levelNumber, smallBlind, bigBlind, ante, durationMinutes, isBreak, breakName } = req.body;
            if (!levelNumber || !smallBlind || !bigBlind || !durationMinutes) {
                return res.status(400).json({
                    error: 'levelNumber, smallBlind, bigBlind, and durationMinutes are required',
                });
            }
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            const level = await blindStructureService.addLevel(structureId, {
                levelNumber,
                smallBlind,
                bigBlind,
                ante,
                durationMinutes,
                isBreak,
                breakName,
            }, managedClubId);
            res.status(201).json({
                message: 'Level added successfully',
                level: {
                    id: level.id,
                    levelNumber: level.levelNumber,
                    smallBlind: level.smallBlind,
                    bigBlind: level.bigBlind,
                    ante: level.ante,
                    durationMinutes: level.durationMinutes,
                    isBreak: level.isBreak,
                    breakName: level.breakName,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * DELETE /blind-structures/:id - Деактивировать структуру
     * Только для администраторов
     */
    static async deactivateStructure(req, res) {
        try {
            const structureId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            const structure = await blindStructureService.deactivateStructure(structureId, managedClubId);
            res.json({
                message: 'Blind structure deactivated',
                structure: {
                    id: structure.id,
                    name: structure.name,
                    isActive: structure.isActive,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
}
exports.BlindStructureController = BlindStructureController;
//# sourceMappingURL=BlindStructureController.js.map