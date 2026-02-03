"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeeder = runSeeder;
const database_1 = require("../../config/database");
const User_1 = require("../../models/User");
const PlayerProfile_1 = require("../../models/PlayerProfile");
const TournamentSeries_1 = require("../../models/TournamentSeries");
async function runSeeder() {
    const userRepository = database_1.AppDataSource.getRepository(User_1.User);
    const playerRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
    const seriesRepository = database_1.AppDataSource.getRepository(TournamentSeries_1.TournamentSeries);
}
//# sourceMappingURL=initial-seed.js.map