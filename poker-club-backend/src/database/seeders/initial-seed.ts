import { AppDataSource } from '../../config/database';
import { User } from '../../models/User';
import { PlayerProfile } from '../../models/PlayerProfile';
import { TournamentSeries } from '../../models/TournamentSeries';
import bcrypt from 'bcrypt';

export async function runSeeder() {
  const userRepository = AppDataSource.getRepository(User);
  const playerRepository = AppDataSource.getRepository(PlayerProfile);
  const seriesRepository = AppDataSource.getRepository(TournamentSeries);

  try {
    // Создай админа
    const adminUser = userRepository.create({
      firstName: 'Admin',
      lastName: 'User',
      phone: '+7999999999',
      email: 'admin@pokerclub.ru',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    });
    await userRepository.save(adminUser);
    console.log('✅ Admin user created');

    // Создай тестовых игроков
    for (let i = 1; i <= 5; i++) {
      const user = userRepository.create({
        firstName: `Player${i}`,
        lastName: `Test`,
        phone: `+799999000${i}`,
        email: `player${i}@test.ru`,
        passwordHash: await bcrypt.hash('password', 10),
        role: 'PLAYER',
      });
      const savedUser = await userRepository.save(user);

      const profile = playerRepository.create({
        user: savedUser,
        mmrValue: Math.floor(Math.random() * 2000),
        rankCode: 'E',
      });
      await playerRepository.save(profile);
    }
    console.log('✅ Test players created');

    // Создай серию турниров
    const series = seriesRepository.create({
      idSeries: 'SERIES_2026_Q1',
      name: 'Q1 2026 Series',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-03-31'),
    });
    await seriesRepository.save(series);
    console.log('✅ Tournament series created');
  } catch (error) {
    console.error('❌ Seeder error:', error);
  }
}
