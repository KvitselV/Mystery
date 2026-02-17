import { TournamentLiveState } from '../models/TournamentLiveState';
export interface LiveStateDto {
    tournamentId: string;
    tournamentName: string;
    currentLevelNumber: number;
    levelRemainingTimeSeconds: number;
    playersCount: number;
    totalParticipants: number;
    totalEntries: number;
    totalChipsInPlay: number;
    averageStack: number;
    isPaused: boolean;
    liveStatus: string;
    nextBreakTime: Date | null;
    updatedAt: Date;
}
export declare class LiveStateService {
    private liveStateRepository;
    private tournamentRepository;
    private seatRepository;
    private registrationRepository;
    private operationRepository;
    private getLiveStateKey;
    private getTimerKey;
    /** Таймер в Redis — источник истины для тикера, снижает нагрузку на БД */
    getTimer(tournamentId: string): Promise<{
        levelRemainingTimeSeconds: number;
        currentLevelNumber: number;
        isPaused: boolean;
    } | null>;
    setTimer(tournamentId: string, data: {
        levelRemainingTimeSeconds: number;
        currentLevelNumber: number;
        isPaused: boolean;
    }): Promise<void>;
    private getFromCache;
    private saveToCache;
    private deleteFromCache;
    /**
     * Создать или получить Live State для турнира
     * + попробовать взять DTO из Redis
     */
    getOrCreateLiveState(tournamentId: string): Promise<TournamentLiveState>;
    /**
     * Обновить Live State
     * + обновить Redis + отправить WebSocket
     */
    updateLiveState(tournamentId: string, updates: Partial<TournamentLiveState>): Promise<TournamentLiveState>;
    /**
     * Пересчитать статистику: активные участники, всего участников, входы, фишки в игре, средний стек
     */
    recalculateStats(tournamentId: string): Promise<TournamentLiveState>;
    pauseTournament(tournamentId: string): Promise<TournamentLiveState>;
    resumeTournament(tournamentId: string): Promise<TournamentLiveState>;
    updateLevelTime(tournamentId: string, remainingSeconds: number): Promise<TournamentLiveState>;
    advanceToNextLevel(tournamentId: string): Promise<TournamentLiveState>;
    /**
     * Получить Live State
     * ⚠️ Важно: для API лучше отдавать DTO и сначала пробовать Redis
     */
    getLiveState(tournamentId: string): Promise<LiveStateDto | null>;
    /**
     * Удалить Live State (при завершении турнира)
     */
    getRebuyAndAddonCounts(tournamentId: string): Promise<{
        rebuyCount: number;
        addonCount: number;
    }>;
    deleteLiveState(tournamentId: string): Promise<void>;
    /**
     * Форматировать Live State для ответа и WebSocket
     */
    private formatLiveState;
}
//# sourceMappingURL=LiveStateService.d.ts.map