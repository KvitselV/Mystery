"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindStructureService = void 0;
const typeorm_1 = require("typeorm");
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
            clubId: data.clubId ?? null,
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
     * Получить все структуры.
     * clubId: для Controller — только своего клуба + глобальные (clubId=null)
     * Без clubId (Admin): все структуры
     */
    async getAllStructures(clubFilter) {
        const baseWhere = { isActive: true };
        if (clubFilter) {
            const [clubStructures, globalStructures] = await Promise.all([
                this.structureRepository.find({
                    where: { ...baseWhere, clubId: clubFilter },
                    relations: ['levels'],
                    order: { createdAt: 'DESC', levels: { levelNumber: 'ASC' } },
                }),
                this.structureRepository.find({
                    where: { ...baseWhere, clubId: (0, typeorm_1.IsNull)() },
                    relations: ['levels'],
                    order: { createdAt: 'DESC', levels: { levelNumber: 'ASC' } },
                }),
            ]);
            return [...clubStructures, ...globalStructures].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return this.structureRepository.find({
            where: baseWhere,
            relations: ['levels'],
            order: { createdAt: 'DESC', levels: { levelNumber: 'ASC' } },
        });
    }
    async ensureCanModify(structureId, managedClubId) {
        const structure = await this.structureRepository.findOne({ where: { id: structureId } });
        if (!structure)
            throw new Error('Blind structure not found');
        if (managedClubId && structure.clubId !== managedClubId) {
            throw new Error('Forbidden: structure belongs to another club');
        }
        return structure;
    }
    async addLevel(structureId, levelData, managedClubId) {
        await this.ensureCanModify(structureId, managedClubId);
        const structure = await this.structureRepository.findOne({
            where: { id: structureId },
        });
        if (!structure)
            throw new Error('Blind structure not found');
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
    async deactivateStructure(id, managedClubId) {
        const structure = await this.ensureCanModify(id, managedClubId);
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