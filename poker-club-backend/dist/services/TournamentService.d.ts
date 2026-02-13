import { Tournament } from '../models/Tournament';
import { TournamentRegistration } from '../models/TournamentRegistration';
export declare class TournamentService {
    private tournamentRepository;
    private seriesRepository;
    private registrationRepository;
    private tournamentRewardRepository;
    private rewardRepository;
    private playerRepository;
    private clubRepository;
    private financialService;
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
        rebuyChips?: number;
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
     */
    registerPlayer(tournamentId: string, playerProfileId: string, paymentMethod?: 'CASH' | 'DEPOSIT'): Promise<TournamentRegistration>;
    /**
     * Получить участников турнира
     */
    getTournamentPlayers(tournamentId: string): Promise<TournamentRegistration[]>;
    /**
     * Изменить статус турнира
     */
    updateTournamentStatus(tournamentId: string, status: 'REG_OPEN' | 'LATE_REG' | 'RUNNING' | 'FINISHED' | 'ARCHIVED'): Promise<Tournament>;
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