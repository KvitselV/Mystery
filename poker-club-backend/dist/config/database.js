"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const path_1 = __importDefault(require("path"));
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isProd = process.env.NODE_ENV === 'production';
const entitiesPath = isProd ? path_1.default.join(__dirname, '../models/**/*.js') : 'src/models/**/*.ts';
const migrationsPath = isProd ? path_1.default.join(__dirname, '../database/migrations/**/*.js') : 'src/database/migrations/**/*.ts';
const subscribersPath = isProd ? path_1.default.join(__dirname, '../database/subscribers/**/*.js') : 'src/database/subscribers/**/*.ts';
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'poker_club',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    entities: [entitiesPath],
    migrations: [migrationsPath],
    subscribers: [subscribersPath],
});
//# sourceMappingURL=database.js.map