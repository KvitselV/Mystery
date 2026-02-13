import { PlayerProfile } from '../models/PlayerProfile';
export type RankCode = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';
export declare class MMRService {
    private playerRepository;
    private resultRepository;
    private tournamentRepository;
    /**
     * Рассчитать изменение ММR на основе финиша в турнире
     */
    calculateMMRChange(finishPosition: number, totalPlayers: number, isFinalTable: boolean): number;
    /**
     * Конвертировать ММR в ранг (E-SS)
     */
    convertMMRToRank(mmrValue: number): RankCode;
    /**
     * Обновить ММР игрока после турнира
     */
    updatePlayerMMR(playerProfileId: string, tournamentId: string): Promise<PlayerProfile>;
    /**
     * Пересчитать ММР для всех игроков турнира
     */
    recalculateTournamentMMR(tournamentId: string): Promise<void>;
    /**
     * Получить топ игроков по ММР
     */
    getTopPlayersByMMR(limit?: number): Promise<PlayerProfile[]>;
    /**
     * Получить игроков по рангу
     */
    getPlayersByRank(rankCode: RankCode): Promise<PlayerProfile[]>;
}
//# sourceMappingURL=MMRService.d.ts.map