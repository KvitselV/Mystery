import { AppDataSource } from '../config/database';
import { AchievementType, AchievementCode, AchievementStatisticType } from '../models/AchievementType';
import { AchievementInstance } from '../models/AchievementInstance';
import { PlayerAchievementPin } from '../models/PlayerAchievementPin';
import { TournamentResult } from '../models/TournamentResult';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { PlayerProfile } from '../models/PlayerProfile';
import { Tournament } from '../models/Tournament';
import { PokerStatisticsService } from './statistics';

export class AchievementService {
  private achievementTypeRepo = AppDataSource.getRepository(AchievementType);
  private achievementInstanceRepo = AppDataSource.getRepository(AchievementInstance);
  private pinRepo = AppDataSource.getRepository(PlayerAchievementPin);
  private resultRepo = AppDataSource.getRepository(TournamentResult);
  private registrationRepo = AppDataSource.getRepository(TournamentRegistration);
  private profileRepo = AppDataSource.getRepository(PlayerProfile);
  private tournamentRepo = AppDataSource.getRepository(Tournament);
  private pokerStats = PokerStatisticsService.getInstance();

  /**
   * Инициализировать типы достижений
   */
  async seedAchievementTypes(): Promise<void> {
    const types = [
      { code: AchievementCode.FIRST_TOURNAMENT, name: 'Первый турнир', description: 'Сыграйте свой первый турнир', icon: '🎯', conditionDescription: 'Сыграть 1 турнир', statisticType: AchievementStatisticType.TOURNAMENTS_PLAYED, targetValue: 1, sortOrder: 1 },
      { code: AchievementCode.FIVE_TOURNAMENTS, name: 'Ветеран', description: 'Сыграйте 5 турниров', icon: '📊', conditionDescription: 'Сыграть 5 турниров', statisticType: AchievementStatisticType.TOURNAMENTS_PLAYED, targetValue: 5, sortOrder: 2 },
      { code: AchievementCode.TEN_TOURNAMENTS, name: 'Постоялец', description: 'Сыграйте 10 турниров', icon: '🏠', conditionDescription: 'Сыграть 10 турниров', statisticType: AchievementStatisticType.TOURNAMENTS_PLAYED, targetValue: 10, sortOrder: 3 },
      { code: AchievementCode.FINAL_TABLE, name: 'Финальный стол', description: 'Попадите на финальный стол', icon: '🪑', conditionDescription: 'Попасть на финальный стол', statisticType: AchievementStatisticType.FINAL_TABLE, targetValue: 1, sortOrder: 4 },
      { code: AchievementCode.WIN, name: 'Победитель', description: 'Выиграйте турнир', icon: '🏆', conditionDescription: 'Выиграть 1 турнир', statisticType: AchievementStatisticType.WINS, targetValue: 1, sortOrder: 5 },
      { code: AchievementCode.HOT_STREAK, name: 'Горячая серия', description: 'Финишируйте в призах 3 раза подряд', icon: '🔥', conditionDescription: 'Финишировать в призах 3 раза подряд', statisticType: AchievementStatisticType.ITM_STREAK, targetValue: 3, sortOrder: 6 },
      { code: AchievementCode.SERIES_WINNER, name: 'Победитель серии', description: 'Выиграйте турнир из серии', icon: '⭐', conditionDescription: 'Выиграть турнир серии', statisticType: AchievementStatisticType.SERIES_WINS, targetValue: 1, sortOrder: 7 },
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
   * Получить достижения, выданные за турнир (по tournamentId)
   */
  async getAchievementsByTournamentId(tournamentId: string): Promise<AchievementInstance[]> {
    return this.achievementInstanceRepo.find({
      where: { tournamentId },
      relations: ['achievementType'],
      order: { unlockedAt: 'ASC' },
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
      const allInPrizes = recentResults.every((r) => r.isFinalTable);
      if (allInPrizes) {
        const a = await this.grantAchievement(userId, AchievementCode.HOT_STREAK, tournamentId, { streak: 3 });
        if (a) granted.push(a);
      }
    }

    // 7. SERIES_WINNER (1-е место в турнире серии)
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
      relations: ['series'],
    });
    if (result.finishPosition === 1 && tournament?.series) {
      const a = await this.grantAchievement(userId, AchievementCode.SERIES_WINNER, tournamentId, { seriesWins: 1 });
      if (a) granted.push(a);
    }

    // 8. Настраиваемые достижения (statisticType + targetValue) — используем PokerStatisticsService
    const customTypes = await this.achievementTypeRepo.find({
      where: {},
      order: { sortOrder: 'ASC' },
    });

    const hasCustomTypes = customTypes.some((t) => t.statisticType && t.targetValue > 0);
    const statsResult = hasCustomTypes
      ? await this.pokerStats.getPlayerStatisticsByProfileId(
          profile.id,
          undefined,
          ['tournamentsPlayed', 'wins', 'seriesWins', 'finalTableCount']
        )
      : null;

    const metrics = statsResult?.metrics ?? {};

    for (const t of customTypes) {
      if (!t.statisticType || t.targetValue <= 0) continue;
      if (t.statisticType === AchievementStatisticType.CONSECUTIVE_POSITION && t.targetPosition == null) continue;
      const existing = await this.achievementInstanceRepo.findOne({
        where: { userId, achievementTypeId: t.id },
      });
      if (existing) continue;

      let value = 0;
      if (t.statisticType === AchievementStatisticType.TOURNAMENTS_PLAYED) {
        value = (metrics.tournamentsPlayed as number) ?? 0;
      } else if (t.statisticType === AchievementStatisticType.WINS) {
        value = (metrics.wins as number) ?? 0;
      } else if (t.statisticType === AchievementStatisticType.SERIES_WINS) {
        value = (metrics.seriesWins as number) ?? 0;
      } else if (t.statisticType === AchievementStatisticType.FINAL_TABLE) {
        value = (metrics.finalTableCount as number) ?? 0;
      } else if (t.statisticType === AchievementStatisticType.ITM_STREAK) {
        value = profile.bestStreak ?? 0;
      } else if (t.statisticType === AchievementStatisticType.CONSECUTIVE_WINS) {
        value = await this.getConsecutiveWins(profile.id);
      } else if (t.statisticType === AchievementStatisticType.CONSECUTIVE_POSITION) {
        const pos = t.targetPosition ?? 1;
        value = await this.getConsecutivePositionCount(profile.id, pos);
      }

      if (value >= t.targetValue) {
        const a = await this.grantAchievementByTypeId(userId, t.id, tournamentId, { value, target: t.targetValue });
        if (a) granted.push(a);
      }
    }

    return granted;
  }

  private async getConsecutiveWins(playerProfileId: string): Promise<number> {
    return this.getConsecutivePositionCount(playerProfileId, 1);
  }

  /**
   * Количество раз подряд с указанным местом.
   * @param targetPosition 1=1-е место, 2=2-е место, ..., 0=последнее место (вылетел первым)
   */
  private async getConsecutivePositionCount(
    playerProfileId: string,
    targetPosition: number
  ): Promise<number> {
    const results = await this.resultRepo.find({
      where: { player: { id: playerProfileId } },
      relations: ['tournament'],
      order: { id: 'DESC' },
      take: 50,
    });
    if (results.length === 0) return 0;

    const tournamentIds = [...new Set(results.map((r) => r.tournament?.id).filter(Boolean) as string[])];

    let totalByTid: Record<string, number> = {};
    if (targetPosition === 0 && tournamentIds.length > 0) {
      const rows = await this.registrationRepo
        .createQueryBuilder('r')
        .select('r.tournament_id', 'tid')
        .addSelect('COUNT(*)', 'cnt')
        .where('r.tournament_id IN (:...ids)', { ids: tournamentIds })
        .groupBy('r.tournament_id')
        .getRawMany();
      totalByTid = Object.fromEntries(rows.map((r) => [r.tid, parseInt(String(r.cnt), 10)]));
    }

    let streak = 0;
    for (const r of results) {
      const matches =
        targetPosition === 0
          ? r.tournament?.id && totalByTid[r.tournament.id]
            ? r.finishPosition === totalByTid[r.tournament.id]
            : false
          : r.finishPosition === targetPosition;
      if (matches) streak++;
      else break;
    }
    return streak;
  }

  /**
   * Выдать достижение по коду (если ещё не выдано)
   */
  private async grantAchievement(
    userId: string,
    achievementCode: string,
    tournamentId: string,
    metadata: Record<string, unknown>
  ): Promise<AchievementInstance | null> {
    const type = await this.achievementTypeRepo.findOne({ where: { code: achievementCode } });
    if (!type) return null;
    return this.grantAchievementByTypeId(userId, type.id, tournamentId, metadata);
  }

  /**
   * Выдать достижение по ID типа (если ещё не выдано)
   */
  async grantAchievementByTypeId(
    userId: string,
    achievementTypeId: string,
    tournamentId: string,
    metadata: Record<string, unknown>
  ): Promise<AchievementInstance | null> {
    const existing = await this.achievementInstanceRepo.findOne({
      where: { userId, achievementTypeId },
    });
    if (existing) return null;

    const type = await this.achievementTypeRepo.findOne({ where: { id: achievementTypeId } });
    if (!type) return null;

    const instance = this.achievementInstanceRepo.create({
      userId,
      achievementType: type,
      tournamentId,
      metadata: JSON.stringify(metadata),
      unlockedAt: new Date(),
    });
    return this.achievementInstanceRepo.save(instance);
  }

  /**
   * Получить прогресс достижений пользователя + закреплённые (до 4)
   */
  async getUserAchievementProgress(userId: string): Promise<{
    unlocked: AchievementInstance[];
    locked: AchievementType[];
    pinnedTypeIds: string[];
    total: number;
    unlockedCount: number;
  }> {
    const allTypes = await this.getAllAchievementTypes();
    const unlocked = await this.getUserAchievements(userId);
    const pins = await this.pinRepo.find({
      where: { userId },
      relations: ['achievementType'],
      order: { sortOrder: 'ASC' },
    });

    const unlockedTypeIds = unlocked.map((a) => a.achievementType.id);
    const locked = allTypes.filter((t) => !unlockedTypeIds.includes(t.id));

    return {
      unlocked,
      locked,
      pinnedTypeIds: pins.map((p) => p.achievementTypeId),
      total: allTypes.length,
      unlockedCount: unlocked.length,
    };
  }

  /**
   * Установить закреплённые достижения (до 4)
   */
  async setPinnedAchievements(userId: string, achievementTypeIds: string[]): Promise<void> {
    await this.pinRepo.delete({ userId });
    const toInsert = achievementTypeIds.slice(0, 4).map((id, i) =>
      this.pinRepo.create({ userId, achievementTypeId: id, sortOrder: i })
    );
    if (toInsert.length > 0) {
      await this.pinRepo.save(toInsert);
    }
  }

  /**
   * Создать тип достижения (админ)
   * Для CONSECUTIVE_POSITION: targetPosition = 1..N (место), 0 = последнее место; targetValue = кол-во раз подряд
   */
  async createAchievementType(data: {
    name: string;
    description: string;
    icon?: string;
    iconUrl?: string;
    statisticType?: string;
    targetValue?: number;
    targetPosition?: number;
    conditionDescription?: string;
  }): Promise<AchievementType> {
    const maxOrder = await this.achievementTypeRepo
      .createQueryBuilder('t')
      .select('MAX(t.sortOrder)', 'max')
      .getRawOne();
    const sortOrder = (maxOrder?.max ?? 0) + 1;

    const type = this.achievementTypeRepo.create({
      name: data.name,
      description: data.description,
      icon: data.icon ?? undefined,
      iconUrl: data.iconUrl ?? undefined,
      statisticType: data.statisticType ?? undefined,
      targetValue: data.targetValue ?? 0,
      targetPosition: data.targetPosition,
      conditionDescription: data.conditionDescription ?? data.description ?? undefined,
      sortOrder,
    });
    return this.achievementTypeRepo.save(type);
  }

  /**
   * Отозвать достижение у игрока (только админ)
   */
  async revokeAchievement(instanceId: string): Promise<void> {
    await this.achievementInstanceRepo.delete(instanceId);
  }
}
