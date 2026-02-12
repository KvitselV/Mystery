import { AppDataSource } from '../config/database';
import { AchievementType, AchievementCode } from '../models/AchievementType';
import { AchievementInstance } from '../models/AchievementInstance';
import { TournamentResult } from '../models/TournamentResult';
import { PlayerProfile } from '../models/PlayerProfile';

export class AchievementService {
  private achievementTypeRepo = AppDataSource.getRepository(AchievementType);
  private achievementInstanceRepo = AppDataSource.getRepository(AchievementInstance);
  private resultRepo = AppDataSource.getRepository(TournamentResult);
  private profileRepo = AppDataSource.getRepository(PlayerProfile);

  /**
   * Инициализировать типы достижений
   */
  async seedAchievementTypes(): Promise<void> {
    const types = [
      {
        code: AchievementCode.FIRST_TOURNAMENT,
        name: 'Первый турнир',
        description: 'Сыграйте свой первый турнир',
        iconUrl: '/achievements/first-tournament.png',
        sortOrder: 1,
      },
      {
        code: AchievementCode.FIVE_TOURNAMENTS,
        name: 'Ветеран',
        description: 'Сыграйте 5 турниров',
        iconUrl: '/achievements/five-tournaments.png',
        sortOrder: 2,
      },
      {
        code: AchievementCode.TEN_TOURNAMENTS,
        name: 'Постоялец',
        description: 'Сыграйте 10 турниров',
        iconUrl: '/achievements/ten-tournaments.png',
        sortOrder: 3,
      },
      {
        code: AchievementCode.FINAL_TABLE,
        name: 'Финальный стол',
        description: 'Попадите на финальный стол',
        iconUrl: '/achievements/final-table.png',
        sortOrder: 4,
      },
      {
        code: AchievementCode.WIN,
        name: 'Победитель',
        description: 'Выиграйте турнир',
        iconUrl: '/achievements/win.png',
        sortOrder: 5,
      },
      {
        code: AchievementCode.HOT_STREAK,
        name: 'Горячая серия',
        description: 'Финишируйте в призах 3 раза подряд',
        iconUrl: '/achievements/hot-streak.png',
        sortOrder: 6,
      },
    ];

    for (const typeData of types) {
      const existing = await this.achievementTypeRepo.findOne({
        where: { code: typeData.code },
      });

      if (!existing) {
        const type = this.achievementTypeRepo.create(typeData);
        await this.achievementTypeRepo.save(type);
      }
    }
  }

  /**
   * Получить все типы достижений
   */
  async getAllAchievementTypes(): Promise<AchievementType[]> {
    return this.achievementTypeRepo.find({
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Получить достижения пользователя
   */
  async getUserAchievements(userId: string): Promise<AchievementInstance[]> {
    return this.achievementInstanceRepo.find({
      where: { userId },
      relations: ['achievementType', 'tournament'],
      order: { unlockedAt: 'DESC' },
    });
  }

  /**
   * Проверить и выдать достижения после турнира
   */
  async checkAndGrantAchievements(
    userId: string,
    tournamentId: string
  ): Promise<AchievementInstance[]> {
    const granted: AchievementInstance[] = [];

    // Получить профиль игрока
    const profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!profile) {
      console.warn(`Profile not found for user ${userId}`);
      return granted;
    }

    // Получить результат по player_id
    const result = await this.resultRepo
      .createQueryBuilder('result')
      .where('result.player_id = :playerId', { playerId: profile.id })
      .andWhere('result.tournament_id = :tournamentId', { tournamentId })
      .getOne();

    if (!result) {
      console.warn(`Result not found for player ${profile.id} in tournament ${tournamentId}`);
      return granted;
    }

    // Получить все результаты игрока по player_id
    const allResults = await this.resultRepo
      .createQueryBuilder('result')
      .where('result.player_id = :playerId', { playerId: profile.id })
      .orderBy('result.id', 'ASC')
      .getMany();

    const tournamentCount = allResults.length;

    // 1. FIRST_TOURNAMENT
    if (tournamentCount === 1) {
      const achievement = await this.grantAchievement(
        userId,
        AchievementCode.FIRST_TOURNAMENT,
        tournamentId,
        { tournamentCount }
      );
      if (achievement) granted.push(achievement);
    }

    // 2. FIVE_TOURNAMENTS
    if (tournamentCount === 5) {
      const achievement = await this.grantAchievement(
        userId,
        AchievementCode.FIVE_TOURNAMENTS,
        tournamentId,
        { tournamentCount }
      );
      if (achievement) granted.push(achievement);
    }

    // 3. TEN_TOURNAMENTS
    if (tournamentCount === 10) {
      const achievement = await this.grantAchievement(
        userId,
        AchievementCode.TEN_TOURNAMENTS,
        tournamentId,
        { tournamentCount }
      );
      if (achievement) granted.push(achievement);
    }

    // 4. FINAL_TABLE
    if (result.isFinalTable) {
      const achievement = await this.grantAchievement(
        userId,
        AchievementCode.FINAL_TABLE,
        tournamentId,
        { finishPosition: result.finishPosition }
      );
      if (achievement) granted.push(achievement);
    }

    // 5. WIN
    if (result.finishPosition === 1) {
      const achievement = await this.grantAchievement(
        userId,
        AchievementCode.WIN,
        tournamentId,
        { finishPosition: 1 }
      );
      if (achievement) granted.push(achievement);
    }

    // 6. HOT_STREAK (3+ финиша в призах подряд)
    const recentResults = allResults.slice(-3);
    if (recentResults.length >= 3) {
      const allInPrizes = recentResults.every(
        (r) => r.isFinalTable );
      if (allInPrizes) {
        const achievement = await this.grantAchievement(
          userId,
          AchievementCode.HOT_STREAK,
          tournamentId,
          { streak: 3 }
        );
        if (achievement) granted.push(achievement);
      }
    }

    return granted;
  }

  /**
   * Выдать достижение (если ещё не выдано)
   */
  private async grantAchievement(
    userId: string,
    achievementCode: AchievementCode,
    tournamentId: string,
    metadata: any
  ): Promise<AchievementInstance | null> {
    // Проверить, не выдано ли уже
    const existing = await this.achievementInstanceRepo
      .createQueryBuilder('instance')
      .leftJoinAndSelect('instance.achievementType', 'type')
      .where('instance.userId = :userId', { userId })
      .andWhere('type.code = :code', { code: achievementCode })
      .getOne();

    if (existing) {
      return null; // Уже выдано
    }

    // Найти тип достижения
    const type = await this.achievementTypeRepo.findOne({
      where: { code: achievementCode },
    });

    if (!type) {
      console.error(`Achievement type not found: ${achievementCode}`);
      return null;
    }

    // Создать экземпляр достижения
    const instance = this.achievementInstanceRepo.create({
      userId,
      achievementType: type,
      tournamentId,
      metadata,
      unlockedAt: new Date(),
    });

    return this.achievementInstanceRepo.save(instance);
  }

  /**
   * Получить прогресс достижений пользователя
   */
  async getUserAchievementProgress(userId: string): Promise<{
    unlocked: AchievementInstance[];
    locked: AchievementType[];
    total: number;
    unlockedCount: number;
  }> {
    const allTypes = await this.getAllAchievementTypes();
    const unlocked = await this.getUserAchievements(userId);

    const unlockedTypeIds = unlocked.map((a) => a.achievementType.id);
    const locked = allTypes.filter((t) => !unlockedTypeIds.includes(t.id));

    return {
      unlocked,
      locked,
      total: allTypes.length,
      unlockedCount: unlocked.length,
    };
  }
}
