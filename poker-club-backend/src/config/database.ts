import path from 'path';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const entitiesPath = isProd ? path.join(__dirname, '../models/**/*.js') : 'src/models/**/*.ts';
const migrationsPath = isProd ? path.join(__dirname, '../database/migrations/**/*.js') : 'src/database/migrations/**/*.ts';
const subscribersPath = isProd ? path.join(__dirname, '../database/subscribers/**/*.js') : 'src/database/subscribers/**/*.ts';

export const AppDataSource = new DataSource({
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
