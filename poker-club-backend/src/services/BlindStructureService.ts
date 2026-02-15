import { IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import { BlindStructure } from '../models/BlindStructure';
import { TournamentLevel } from '../models/TournamentLevel';

interface CreateLevelDto {
  levelNumber: number;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  durationMinutes: number;
  isBreak?: boolean;
  breakName?: string;
}

interface CreateBlindStructureDto {
  name: string;
  description?: string;
  levels: CreateLevelDto[];
  clubId?: string | null;
}

export class BlindStructureService {
  private structureRepository = AppDataSource.getRepository(BlindStructure);
  private levelRepository = AppDataSource.getRepository(TournamentLevel);

  /**
   * Создать новую структуру блайндов
   */
  async createStructure(data: CreateBlindStructureDto): Promise<BlindStructure> {
    // Создай структуру
    const structure = this.structureRepository.create({
      name: data.name,
      description: data.description,
      isActive: true,
      clubId: data.clubId ?? null,
    });

    const savedStructure = await this.structureRepository.save(structure);

    // Создай уровни
    const levels = data.levels.map((levelData) =>
      this.levelRepository.create({
        blindStructure: savedStructure,
        levelNumber: levelData.levelNumber,
        smallBlind: levelData.smallBlind,
        bigBlind: levelData.bigBlind,
        ante: levelData.ante || 0,
        durationMinutes: levelData.durationMinutes,
        isBreak: levelData.isBreak || false,
        breakName: levelData.breakName,
      })
    );

    await this.levelRepository.save(levels);

    return this.getStructureById(savedStructure.id);
  }

  /**
   * Получить структуру по ID
   */
  async getStructureById(id: string): Promise<BlindStructure> {
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
  async getAllStructures(clubFilter?: string | null): Promise<BlindStructure[]> {
    const baseWhere = { isActive: true };
    if (clubFilter) {
      const [clubStructures, globalStructures] = await Promise.all([
        this.structureRepository.find({
          where: { ...baseWhere, clubId: clubFilter },
          relations: ['levels'],
          order: { createdAt: 'DESC', levels: { levelNumber: 'ASC' } },
        }),
        this.structureRepository.find({
          where: { ...baseWhere, clubId: IsNull() },
          relations: ['levels'],
          order: { createdAt: 'DESC', levels: { levelNumber: 'ASC' } },
        }),
      ]);
      return [...clubStructures, ...globalStructures].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return this.structureRepository.find({
      where: baseWhere,
      relations: ['levels'],
      order: { createdAt: 'DESC', levels: { levelNumber: 'ASC' } },
    });
  }

  async ensureCanModify(structureId: string, managedClubId?: string | null): Promise<BlindStructure> {
    const structure = await this.structureRepository.findOne({ where: { id: structureId } });
    if (!structure) throw new Error('Blind structure not found');
    if (managedClubId && structure.clubId !== managedClubId) {
      throw new Error('Forbidden: structure belongs to another club');
    }
    return structure;
  }

  async addLevel(structureId: string, levelData: CreateLevelDto, managedClubId?: string | null): Promise<TournamentLevel> {
    await this.ensureCanModify(structureId, managedClubId);
    const structure = await this.structureRepository.findOne({
      where: { id: structureId },
    });
    if (!structure) throw new Error('Blind structure not found');

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
  async removeLevel(levelId: string): Promise<void> {
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
  async updateLevel(levelId: string, updates: Partial<CreateLevelDto>): Promise<TournamentLevel> {
    const level = await this.levelRepository.findOne({
      where: { id: levelId },
    });

    if (!level) {
      throw new Error('Level not found');
    }

    Object.assign(level, updates);

    return this.levelRepository.save(level);
  }

  async deactivateStructure(id: string, managedClubId?: string | null): Promise<BlindStructure> {
    const structure = await this.ensureCanModify(id, managedClubId);
    structure.isActive = false;
    return this.structureRepository.save(structure);
  }

  /**
   * Получить уровень по номеру для конкретной структуры
   */
  async getLevelByNumber(structureId: string, levelNumber: number): Promise<TournamentLevel | null> {
    return this.levelRepository.findOne({
      where: {
        blindStructure: { id: structureId },
        levelNumber,
      },
    });
  }
}
