/**
 * Фоновый процесс: каждую секунду уменьшает levelRemainingTimeSeconds в Redis.
 * БД — только при смене уровня и синхронизации. Снижает нагрузку на БД.
 */
export declare function startTournamentLevelTicker(): void;
//# sourceMappingURL=TournamentLevelTicker.d.ts.map