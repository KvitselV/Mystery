"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTournamentStatusSync = startTournamentStatusSync;
const TournamentService_1 = require("./TournamentService");
const INTERVAL_MS = 60 * 60 * 1000; // каждый час
/**
 * Фоновый процесс: каждый час переводит турниры с датой начала «сегодня»
 * из ANNOUNCED в REG_OPEN. Админ может вручную открыть регистрацию в любой момент.
 */
function startTournamentStatusSync() {
    const tournamentService = new TournamentService_1.TournamentService();
    const run = async () => {
        try {
            const count = await tournamentService.syncTournamentStatusByDate();
            if (count > 0) {
                console.log(`[StatusSync] ${count} tournament(s) ANNOUNCED → REG_OPEN (today)`);
            }
        }
        catch (err) {
            console.error('[StatusSync] Error:', err instanceof Error ? err.message : err);
        }
    };
    run();
    setInterval(run, INTERVAL_MS);
}
//# sourceMappingURL=TournamentStatusSync.js.map