import { BlindStructure } from '../models/BlindStructure';
import { TournamentLevel } from '../models/TournamentLevel';
export type BreakType = 'REGULAR' | 'END_LATE_REG' | 'ADDON' | 'END_LATE_REG_AND_ADDON';
interface CreateLevelDto {
    levelNumber: number;
    smallBlind: number;
    bigBlind: number;
    ante?: number;
    durationMinutes: number;
    isBreak?: boolean;
    breakName?: string;
    breakType?: BreakType;
}
interface CreateBlindStructureDto {
    name: string;
    description?: string;
    levels: CreateLevelDto[];
    clubId?: string | null;
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
     * Получить все структуры.
     * clubId: для Controller — только своего клуба + глобальные (clubId=null)
     * Без clubId (Admin): все структуры
     */
    getAllStructures(clubFilter?: string | null): Promise<BlindStructure[]>;
    ensureCanModify(structureId: string, managedClubId?: string | null): Promise<BlindStructure>;
    addLevel(structureId: string, levelData: CreateLevelDto, managedClubId?: string | null): Promise<TournamentLevel>;
    /**
     * Добавить уровень по коэффициенту от последнего уровня.
     * coefficient умножает SB, BB, ante последнего уровня.
     */
    addLevelWithCoefficient(structureId: string, coefficient: number, durationMinutes: number, managedClubId?: string | null): Promise<TournamentLevel>;
    /**
     * Удалить уровень
     */
    removeLevel(levelId: string): Promise<void>;
    /**
     * Обновить уровень
     */
    updateLevel(levelId: string, updates: Partial<CreateLevelDto>): Promise<TournamentLevel>;
    deactivateStructure(id: string, managedClubId?: string | null): Promise<BlindStructure>;
    /**
     * Получить уровень по номеру для конкретной структуры
     */
    getLevelByNumber(structureId: string, levelNumber: number): Promise<TournamentLevel | null>;
}
export {};
//# sourceMappingURL=BlindStructureService.d.ts.map