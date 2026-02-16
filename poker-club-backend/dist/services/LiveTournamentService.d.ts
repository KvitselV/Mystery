import { Tournament } from '../models/Tournament';
import { PlayerOperation } from '../models/PlayerOperation';
import { TournamentResult } from '../models/TournamentResult';
import { TournamentLevel } from '../models/TournamentLevel';
export declare class LiveTournamentService {
    private tournamentRepository;
    private playerRepository;
    private operationRepository;
    private registrationRepository;
    private resultRepository;
    private blindStructureRepository;
    private levelRepository;
    private liveStateService;
    private seatingService;
    private mmrService;
    private leaderboardService;
    private achievementService;
    private statisticsService;
    rebuy(tournamentId: string, playerProfileId: string, amount?: number): Promise<PlayerOperation>;
    /**
     * Аддон - игрок докупает дополнительные фишки
     */
    addon(tournamentId: string, playerProfileId: string, amount: number): Promise<PlayerOperation>;
    /**
     * Выбытие игрока с записью результата.
     * finishPosition — место вылета. Если не указано, считается автоматически
     * (следующее место после уже вылетевших).
     */
    eliminatePlayer(tournamentId: string, playerProfileId: string, finishPosition?: number): Promise<TournamentResult>;
    moveToNextLevel(tournamentId: string): Promise<{
        tournament: Tournament;
        currentLevel: TournamentLevel | null;
    }>;
    moveToPrevLevel(tournamentId: string): Promise<{
        tournament: Tournament;
        currentLevel: TournamentLevel | null;
    }>;
    getCurrentLevel(tournamentId: string): Promise<TournamentLevel | null>;
    getNextLevel(tournamentId: string): Promise<TournamentLevel | null>;
    /**
     * Получить все операции игрока в турнире
     */
    getPlayerOperationsInTournament(playerProfileId: string): Promise<PlayerOperation[]>;
    /**
     * Завершить турнир и обновить все рейтинги
     */
    finishTournament(tournamentId: string): Promise<void>;
}
//# sourceMappingURL=LiveTournamentService.d.ts.map