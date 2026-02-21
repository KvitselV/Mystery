export interface ExcelImportPlayer {
    name: string;
    cardNumber: string;
}
export interface ExcelImportTournamentResult {
    cardNumber: string;
    points: number;
}
export interface ExcelImportTournament {
    date: string;
    results: ExcelImportTournamentResult[];
}
export interface ExcelImportData {
    clubId: string;
    seriesName: string;
    players: ExcelImportPlayer[];
    tournaments: ExcelImportTournament[];
}
export interface ExcelImportResult {
    playersCreated: number;
    playersSkipped: number;
    tournamentsCreated: number;
    seriesId: string;
    seriesName: string;
}
export declare class ExcelImportService {
    private userRepository;
    private playerRepository;
    private balanceRepository;
    private seriesRepository;
    private tournamentRepository;
    private registrationRepository;
    private resultRepository;
    private leaderboardService;
    /**
     * Импорт данных из Excel-подобной структуры.
     * - Создаёт игроков (пароль = номер_карты + "-"), пропускает существующих по clubCardNumber
     * - Создаёт турнирную серию и турниры
     * - Все турниры со статусом FINISHED
     * - Позиции по очкам (desc), при равенстве — меньший номер карты выше
     */
    import(data: ExcelImportData): Promise<ExcelImportResult>;
    private parseDate;
}
//# sourceMappingURL=ExcelImportService.d.ts.map