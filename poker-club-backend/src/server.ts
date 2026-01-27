import app from './app';
import { AppDataSource } from './config/database';
import { runSeeder } from './database/seeders/initial-seed';

const PORT = parseInt(process.env.PORT || '3001', 10);

AppDataSource.initialize().then(async () => {
  console.log('✅ Database connected');

  // Запусти seeder только в development
  if (process.env.NODE_ENV === 'development') {
    await runSeeder();
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});