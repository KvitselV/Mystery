"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindStructureService = void 0;
const database_1 = require("../config/database");
const BlindStructure_1 = require("../models/BlindStructure");
const TournamentLevel_1 = require("../models/TournamentLevel");
class BlindStructureService {
    constructor() {
        this.structureRepository = database_1.AppDataSource.getRepository(BlindStructure_1.BlindStructure);
        this.levelRepository = database_1.AppDataSource.getRepository(TournamentLevel_1.TournamentLevel);
    }
    /**
     * Создать новую структуру блайндов
     */
    async createStructure(data) {
        // Создай структуру
        const structure = this.structureRepository.create({
            name: data.name,
            description: data.description,
            isActive: true,
        });
        const savedStructure = await this.structureRepository.save(structure);
        // Создай уровни
        const levels = data.levels.map((levelData) => this.levelRepository.create({
            blindStructure: savedStructure,
            levelNumber: levelData.levelNumber,
            smallBlind: levelData.smallBlind,
            bigBlind: levelData.bigBlind,
            ante: levelData.ante || 0,
            durationMinutes: levelData.durationMinutes,
            isBreak: levelData.isBreak || false,
            breakName: levelData.breakName,
        }));
        await this.levelRepository.save(levels);
        return this.getStructureById(savedStructure.id);
    }
    /**
     * Получить структуру по ID
     */
    async getStructureById(id) {
        const structure = await this.structureRepository.findOne({
            where: { id },
            relations: ['levels'],
            order: { levels: { levelNumber: 'ASC' } },
        });
        if (!structure) {
            throw new Error('Blind structure not found');
        }
        return structure;
    }
    /**
     * Получить все структуры
     */
    async getAllStructures() {
        return this.structureRepository.find({
            where: { isActive: true },
            relations: ['levels'],
            order: { createdAt: 'DESC', levels: { levelNumber: 'ASC' } },
        });
    }
    /**
     * Добавить уровень к структуре
     */
    async addLevel(structureId, levelData) {
        const structure = await this.structureRepository.findOne({
            where: { id: structureId },
        });
        if (!structure) {
            throw new Error('Blind structure not found');
        }
        const level = this.levelRepository.create({
            blindStructure: structure,
            levelNumber: levelData.levelNumber,
            smallBlind: levelData.smallBlind,
            bigBlind: levelData.bigBlind,
            ante: levelData.ante || 0,
            durationMinutes: levelData.durationMinutes,
            isBreak: levelData.isBreak || false,
            breakName: levelData.breakName,
        });
        return this.levelRepository.save(level);
    }
    /**
     * Удалить уровень
     */
    async removeLevel(levelId) {
        const level = await this.levelRepository.findOne({
            where: { id: levelId },
        });
        if (!level) {
            throw new Error('Level not found');
        }
        await this.levelRepository.remove(level);
    }
    /**
     * Обновить уровень
     */
    async updateLevel(levelId, updates) {
        const level = await this.levelRepository.findOne({
            where: { id: levelId },
        });
        if (!level) {
            throw new Error('Level not found');
        }
        Object.assign(level, updates);
        return this.levelRepository.save(level);
    }
    /**
     * Деактивировать структуру
     */
    async deactivateStructure(id) {
        const structure = await this.structureRepository.findOne({
            where: { id },
        });
        if (!structure) {
            throw new Error('Blind structure not found');
        }
        structure.isActive = false;
        return this.structureRepository.save(structure);
    }
    /**
     * Получить уровень по номеру для конкретной структуры
     */
    async getLevelByNumber(structureId, levelNumber) {
        return this.levelRepository.findOne({
            where: {
                blindStructure: { id: structureId },
                levelNumber,
            },
        });
    }
}
exports.BlindStructureService = BlindStructureService;
//# sourceMappingURL=BlindStructureService.js.map