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
     * Регистрация игрока на турнир
     * @param isArrived - если false, игрок зарегистрировался сам и ещё не прибыл в клуб
     */
    registerPlayer(tournamentId: string, playerProfileId: string, paymentMethod?: 'CASH' | 'DEPOSIT', isArrived?: boolean): Promise<TournamentRegistration>;
    /**
     * Получить участников турнира
     */
    getTournamentPlayers(tournamentId: string): Promise<TournamentRegistration[]>;
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
    updateTournamentStatus(tournamentId: string, status: 'REG_OPEN' | 'LATE_REG' | 'RUNNING' | 'FINISHED' | 'ARCHIVED', managedClubId?: string | null): Promise<Tournament>;
    /**
     * Получить турнир по ID
     */
    getTournamentById(tournamentId: string): Promise<Tournament>;
    /**
 * Отменить регистрацию на турнир
 */
    unregisterFromTournament(userId: string, tournamentId: string): Promise<void>;
}
//# sourceMappingURL=TournamentService.d.ts.map