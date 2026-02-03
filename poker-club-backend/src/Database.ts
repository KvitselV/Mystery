import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { PlayerProfile } from '../src/models/PlayerProfile';
import { Tournament } from '../src/models/Tournament';
import { TournamentSeries } from '../src/models/TournamentSeries';
import { TournamentTable } from '../src/models/TournamentTable';
import { TableSeat } from '../src/models/TableSeat';
import { TournamentRegistration } from '../src/models/TournamentRegistration';
import { TournamentResult } from '../src/models/TournamentResult';
import { PlayerOperation } from '../src/models/PlayerOperation';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'poker_club',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    PlayerProfile,
    Tournament,
    TournamentSeries,
    TournamentTable,
    TableSeat,
    TournamentRegistration,
    TournamentResult,
    PlayerOperation,
  ],
  
  migrations: ['src/database/migrations/**/*.ts'],
  subscribers: ['src/database/subscribers/**/*.ts'],
});
