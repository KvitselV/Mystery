import { Club } from '../models/Club';
import { ClubTable } from '../models/ClubTable';
import { ClubSchedule } from '../models/ClubSchedule';
export declare class ClubService {
    private clubRepository;
    private clubTableRepository;
    private clubScheduleRepository;
    /**
     * Создать клуб с заданным количеством столов
     */
    createClub(data: {
        name: string;
        description?: string;
        address?: string;
        phone?: string;
        tableCount: number;
    }): Promise<Club>;
    /**
     * Получить список всех клубов
     */
    getClubs(filters?: {
        isActive?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<{
        clubs: Club[];
        total: number;
    }>;
    /**
     * Получить клуб по ID
     */
    getClubById(clubId: string): Promise<Club>;
    /**
     * Обновить информацию о клубе
     */
    updateClub(clubId: string, data: {
        name?: string;
        description?: string;
        address?: string;
        phone?: string;
        isActive?: boolean;
    }): Promise<Club>;
    /**
     * Удалить клуб
     */
    deleteClub(clubId: string): Promise<void>;
    /**
     * Добавить расписание для клуба
     */
    addSchedule(clubId: string, data: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        eventType?: string;
        description?: string;
    }): Promise<ClubSchedule>;
    /**
     * Получить расписание клуба
     */
    getClubSchedules(clubId: string, filters?: {
        dayOfWeek?: number;
        isActive?: boolean;
    }): Promise<ClubSchedule[]>;
    /**
     * Обновить расписание
     */
    updateSchedule(scheduleId: string, data: {
        dayOfWeek?: number;
        startTime?: string;
        endTime?: string;
        eventType?: string;
        description?: string;
        isActive?: boolean;
    }): Promise<ClubSchedule>;
    /**
     * Удалить расписание
     */
    deleteSchedule(scheduleId: string): Promise<void>;
    /**
     * Получить столы клуба
     */
    getClubTables(clubId: string): Promise<ClubTable[]>;
    /**
     * Обновить статус стола
     */
    updateTableStatus(tableId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'): Promise<ClubTable>;
}
//# sourceMappingURL=ClubService.d.ts.map