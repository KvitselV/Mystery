import { AppDataSource } from '../../config/database';
import { User } from '../../models/User';
import { PlayerProfile } from '../../models/PlayerProfile';
import { TournamentSeries } from '../../models/TournamentSeries';
import bcrypt from 'bcrypt';

export async function runSeeder() {
  const userRepository = AppDataSource.getRepository(User);
  const playerRepository = AppDataSource.getRepository(PlayerProfile);
  const seriesRepository = AppDataSource.getRepository(TournamentSeries);


}
