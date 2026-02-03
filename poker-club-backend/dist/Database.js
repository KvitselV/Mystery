"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../src/models/User");
const PlayerProfile_1 = require("../src/models/PlayerProfile");
const Tournament_1 = require("../src/models/Tournament");
const TournamentSeries_1 = require("../src/models/TournamentSeries");
const TournamentTable_1 = require("../src/models/TournamentTable");
const TableSeat_1 = require("../src/models/TableSeat");
const TournamentRegistration_1 = require("../src/models/TournamentRegistration");
const TournamentResult_1 = require("../src/models/TournamentResult");
const PlayerOperation_1 = require("../src/models/PlayerOperation");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'poker_club',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    entities: [
        User_1.User,
        PlayerProfile_1.PlayerProfile,
        Tournament_1.Tournament,
        TournamentSeries_1.TournamentSeries,
        TournamentTable_1.TournamentTable,
        TableSeat_1.TableSeat,
        TournamentRegistration_1.TournamentRegistration,
        TournamentResult_1.TournamentResult,
        PlayerOperation_1.PlayerOperation,
    ],
    migrations: ['src/database/migrations/**/*.ts'],
    subscribers: ['src/database/subscribers/**/*.ts'],
});
//# sourceMappingURL=Database.js.map