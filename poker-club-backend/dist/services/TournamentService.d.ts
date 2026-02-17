import { Tournament } from '../models/Tournament';
import { TournamentRegistration } from '../models/TournamentRegistration';
export declare class TournamentService {
    private tournamentRepository;
    private seriesRepository;
    private seatingService;
    private liveStateService;
    private registrationRepository;
    private tournamentRewardRepository;
    private rewardRepository;
    private playerRepository;
    private clubRepository;
    private financialService;
    private playerOperationRepository;
    private playerBillRepository;
    private orderRepository;
    private achievementInstanceRepository;
    /**
     * Создать турнир
     */
    createTournament(data: {
        name: string;
        seriesId?: string;
        clubId?: string;
        startTime: Date;
        buyInCost: number;
        startingStack: number;
        addonChips?: number;
        addonCost?: number;
        rebuyChips?: number;
        rebuyCost?: number;
        maxRebuys?: number;
        maxAddons?: number;
        blindStructureId?: string;
        rewards?: {
            rewardId: string;
            place: number;
        }[];
    }): Promise<Tournament>;
    /**
     * Синхронизация статусов по дате: турниры с startTime сегодня и статусом ANNOUNCED
     * переводятся в REG_OPEN. Вызывается периодически (каждый час).
     * Админ по‑прежнему может вручную открыть регистрацию для любого турнира.
     */
    syncTournamentStatusByDate(): Promise<number>;
    /**
     * Установить награды турнира (место -> награда). Заменяет текущий список.
     */
    setTournamentRewards(tournamentId: string, rewards: {
        rewardId: string;
        place: number;
    }[]): Promise<void>;
    /**
     * Получить список турниров
     */
    getTournaments(filters?: {
        status?: string;
        seriesId?: string;
        clubId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        tournaments: Tournament[];
        total: number;
    }>;
    /**
     * Регистрация игрока на турнир.
     * Разрешена только при REG_OPEN (до старта) или LATE_REG (поздняя регистрация).
     * При RUNNING регистрация закрыта (после перерыва "конец поздней регистрации").
     */
    registerPlayer(tournamentId: string, playerProfileId: string, paymentMethod?: 'CASH' | 'DEPOSIT', isArrived?: boolean): Promise<TournamentRegistration>;
    /**
     * Получить участников турнира
     */
    getTournamentPlayers(tournamentId: string): Promise<TournamentRegistration[]>;
    /**
     * ID игроков, имеющих результат в турнире (вылетевших)
     */
    getEliminatedPlayerIds(tournamentId: string): Promise<Set<string>>;
    /** Отметить игрока как прибывшего в клуб (управляющий нажал «Прибыл») */
    markPlayerArrived(tournamentId: string, registrationId: string, managedClubId?: string | null): Promise<TournamentRegistration>;
    ensureTournamentBelongsToClub(tournamentId: string, managedClubId?: string | null): Promise<Tournament>;
    updateTournament(tournamentId: string, data: Partial<{
        name: string;
        seriesId: string | null;
        clubId: string | null;
        startTime: Date;
        buyInCost: number;
        startingStack: number;
        addonChips: number;
        addonCost: number;
        rebuyChips: number;
        rebuyCost: number;
        maxRebuys: number;
        maxAddons: number;
        blindStructureId: string | null;
    }>, managedClubId?: string | null): Promise<Tournament>;
    deleteTournament(tournamentId: string, managedClubId?: string | null, options?: {
        force?: boolean;
    }): Promise<void>;
    updateTournamentStatus(tournamentId: string, status: 'ANNOUNCED' | 'REG_OPEN' | 'LATE_REG' | 'RUNNING' | 'FINISHED' | 'ARCHIVED', managedClubId?: string | null): Promise<Tournament>;
    /**
     * Получить турнир по ID (полная загрузка — registrations, rewards и т.д.)
     */
    getTournamentById(tournamentId: string): Promise<Tournament>;
    /**
     * Облегчённый турнир для live — только blindStructure, без registrations, rewards и тяжёлых связей
     */
    getTournamentForLive(tournamentId: string): Promise<Tournament | null>;
    /**
 * Отменить регистрацию на турнир
 */
    unregisterFromTournament(userId: string, tournamentId: string): Promise<void>;
}
//# sourceMappingURL=TournamentService.d.ts.map