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
}
export declare class BlindStructureService {
    private structureRepository;
    private levelRepository;
    /**
     * Создать новую структуру блайндов
     */
    createStructure(data: CreateBlindStructureDto): Promise<BlindStructure>;
    /**
     * Получить структуру по ID
     */
    getStructureById(id: string): Promise<BlindStructure>;
    /**
     * Получить все структуры
     */
    getAllStructures(): Promise<BlindStructure[]>;
    /**
     * Добавить уровень к структуре
     */
    addLevel(structureId: string, levelData: CreateLevelDto): Promise<TournamentLevel>;
    /**
     * Удалить уровень
     */
    removeLevel(levelId: string): Promise<void>;
    /**
     * Обновить уровень
     */
    updateLevel(levelId: string, updates: Partial<CreateLevelDto>): Promise<TournamentLevel>;
    /**
     * Деактивировать структуру
     */
    deactivateStructure(id: string): Promise<BlindStructure>;
    /**
     * Получить уровень по номеру для конкретной структуры
     */
    getLevelByNumber(structureId: string, levelNumber: number): Promise<TournamentLevel | null>;
}
export {};
//# sourceMappingURL=BlindStructureService.d.ts.map