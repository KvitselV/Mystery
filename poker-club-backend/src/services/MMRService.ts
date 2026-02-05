import { AppDataSource } from '../config/database';
import { PlayerProfile } from '../models/PlayerProfile';
import { TournamentResult } from '../models/TournamentResult';
import { Tournament } from '../models/Tournament';

export type RankCode = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';

export class MMRService {
  private playerRepository = AppDataSource.getRepository(PlayerProfile);
  private resultRepository = AppDataSource.getRepository(TournamentResult);
  private tournamentRepository = AppDataSource.getRepository(Tournament);

  /**
   * Рассчитать изменение ММR на основе финиша в турнире
   */
  calculateMMRChange(
    finishPosition: number,
    totalPlayers: number,
    isFinalTable: boolean
  ): number {
    let mmrChange = 0;

    // Базовые очки за участие
    mmrChange += 10;

    // Бонус за финальный стол
    if (isFinalTable) {
      mmrChange += 50;
    }

    // Бонус за призовые места
    if (finishPosition === 1) {
      mmrChange += 100; // 1-е место
    } else if (finishPosition === 2) {
      mmrChange += 70; // 2-е место
    } else if (finishPosition === 3) {
      mmrChange += 50; // 3-е место
    } else if (finishPosition <= 5) {
      mmrChange += 30; // 4-5 места
    } else if (finishPosition <= 9) {
      mmrChange += 20; // 6-9 места (финальный стол)
    }

    // Штраф за раннее выбытие (если выбыл раньше половины)
    const halfPlayers = Math.floor(totalPlayers / 2);
    if (finishPosition > halfPlayers) {
      mmrChange -= 10;
    }

    // Коэффициент в зависимости от размера турнира
    if (totalPlayers >= 50) {
      mmrChange = Math.floor(mmrChange * 1.5); // Большие турниры дают больше очков
    } else if (totalPlayers >= 30) {
      mmrChange = Math.floor(mmrChange * 1.2);
    }

    return mmrChange;
  }

  /**
   * Конвертировать ММR в ранг (E-SS)
   */
  convertMMRToRank(mmrValue: number): RankCode {
    if (mmrValue >= 3001) return 'SS';
    if (mmrValue >= 2501) return 'S';
    if (mmrValue >= 2001) return 'A';
    if (mmrValue >= 1501) return 'B';
    if (mmrValue >= 1001) return 'C';
    if (mmrValue >= 501) return 'D';
    return 'E';
  }

  /**
   * Обновить ММР игрока после турнира
   */
    async updatePlayerMMR(
    playerProfileId: string,
    tournamentId: string
    
  ): Promise<PlayerProfile> {
    const player = await this.playerRepository.findOne({
      where: { id: playerProfileId },
      relations: ['user'],
    });
    
    console.log('updatePlayerMMR CALLED FOR:', { playerProfileId, tournamentId });

    if (!player) {
      throw new Error('Player not found');
    }

    const result = await this.resultRepository.findOne({
      where: {
        player: { id: playerProfileId },
        tournament: { id: tournamentId },
      },
      relations: ['tournament'],
    });

    if (!result) {
      throw new Error('Tournament result not found');
    }

    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['registrations'],
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const totalPlayers = tournament.registrations.length;

    const mmrChange = this.calculateMMRChange(
      result.finishPosition,
      totalPlayers,
      result.isFinalTable
    );

    // сохраняем в результате, чтобы потом можно было видеть сколько дали за турнир
    result.mmrGained = mmrChange;
    await this.resultRepository.save(result);

    const previousMMR = player.mmrValue;
    const newMMR = Math.max(0, previousMMR + mmrChange);
    player.mmrValue = newMMR;
    player.rankCode = this.convertMMRToRank(newMMR);

    const updatedPlayer = await this.playerRepository.save(player);

    console.log(
      `✅ Updated MMR for player ${playerProfileId}: ${previousMMR} → ${newMMR} (${player.rankCode})`
    );
    

    return updatedPlayer;
  }

  /**
   * Пересчитать ММР для всех игроков турнира
   */
  async recalculateTournamentMMR(tournamentId: string): Promise<void> {
    // Берём ВСЕ результаты и фильтруем по турниру вручную
    const allResults = await this.resultRepository.find({
      relations: ['player', 'player.user', 'tournament'],
    });

    console.log('ALL RESULTS COUNT:', allResults.length);

    const results = allResults.filter(
      (r) => r.tournament && r.tournament.id === tournamentId
    );

    console.log(
      `🔄 Recalculating MMR for ${results.length} players in tournament ${tournamentId}`
    );

    if (results.length === 0) {
      console.warn(`⚠️ No results found for tournament ${tournamentId}`);
      return;
    }

    console.log('MMR RESULTS:', results.map(r => ({
      resultId: r.id,
      playerId: r.player.id,
      finishPosition: r.finishPosition,
      isFinalTable: r.isFinalTable,
    })));

    for (const result of results) {
      try {
        await this.updatePlayerMMR(result.player.id, tournamentId);
      } catch (error: any) {
        console.error(
          `❌ Failed to update MMR for player ${result.player.id}:`,
          error.message
        );
      }
    }

    console.log(`✅ MMR recalculation complete for tournament ${tournamentId}`);
  }

  /**
   * Получить топ игроков по ММР
   */
  async getTopPlayersByMMR(limit: number = 50): Promise<PlayerProfile[]> {
    return this.playerRepository.find({
      order: { mmrValue: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  /**
   * Получить игроков по рангу
   */
  async getPlayersByRank(rankCode: RankCode): Promise<PlayerProfile[]> {
    return this.playerRepository.find({
      where: { rankCode },
      order: { mmrValue: 'DESC' },
      relations: ['user'],
    });
  }
}
