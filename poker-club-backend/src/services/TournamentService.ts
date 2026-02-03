import { AppDataSource } from '../config/database';
import { Tournament } from '../models/Tournament';
import { TournamentSeries } from '../models/TournamentSeries';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { PlayerProfile } from '../models/PlayerProfile';
import { FinancialService } from './FinancialService';

export class TournamentService {
  private tournamentRepository = AppDataSource.getRepository(Tournament);
  private seriesRepository = AppDataSource.getRepository(TournamentSeries);
  private registrationRepository = AppDataSource.getRepository(TournamentRegistration);
  private playerRepository = AppDataSource.getRepository(PlayerProfile);
  private financialService = new FinancialService();

  /**
   * Создать турнир
   */
  async createTournament(data: {
    name: string;
    seriesId?: string;
    startTime: Date;
    buyInAmount: number;
    startingStack: number;
    blindStructureId?: string;
  }): Promise<Tournament> {
    const series = data.seriesId
      ? await this.seriesRepository.findOne({ where: { id: data.seriesId } })
      : null;

    const tournament = this.tournamentRepository.create({
      name: data.name,
      series: series || undefined,
      startTime: data.startTime,
      buyInAmount: data.buyInAmount,
      startingStack: data.startingStack,
      blindStructureId: data.blindStructureId,
      status: 'REG_OPEN',
      currentLevelNumber: 0,
    });

    return await this.tournamentRepository.save(tournament);
  }

  /**
   * Получить список турниров
   */
  async getTournaments(filters?: {
    status?: string;
    seriesId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tournaments: Tournament[]; total: number }> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.seriesId) {
      where.series = { id: filters.seriesId };
    }

    const [tournaments, total] = await this.tournamentRepository.findAndCount({
      where,
      relations: ['series'],
      order: { startTime: 'ASC' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return { tournaments, total };
  }

  /**
   * Регистрация игрока на турнир
   */
  async registerPlayer(
    tournamentId: string,
    playerProfileId: string,
    paymentMethod: 'CASH' | 'DEPOSIT' = 'DEPOSIT'
  ): Promise<TournamentRegistration> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'REG_OPEN' && tournament.status !== 'LATE_REG') {
      throw new Error('Tournament is not open for registration');
    }

    // Проверь, не зарегистрирован ли уже
    const existingReg = await this.registrationRepository.findOne({
      where: {
        tournament: { id: tournamentId },
        player: { id: playerProfileId },
      },
    });

    if (existingReg) {
      throw new Error('Player already registered');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerProfileId },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Спиши бай-ин с депозита (если DEPOSIT)
    if (paymentMethod === 'DEPOSIT') {
      await this.financialService.deductBalance(
        playerProfileId,
        tournament.buyInAmount,
        'BUYIN',
        tournamentId
      );
    }

    // Создай регистрацию
    const registration = this.registrationRepository.create({
      tournament,
      player,
      registeredAt: new Date(),
      paymentMethod,
      isActive: true,
    });

    await this.registrationRepository.save(registration);

    return registration;
  }

  /**
   * Получить участников турнира
   */
  async getTournamentPlayers(tournamentId: string): Promise<TournamentRegistration[]> {
    return await this.registrationRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: ['player', 'player.user'],
      order: { registeredAt: 'ASC' },
    });
  }

  /**
   * Изменить статус турнира
   */
  async updateTournamentStatus(
    tournamentId: string,
    status: 'REG_OPEN' | 'LATE_REG' | 'RUNNING' | 'FINISHED' | 'ARCHIVED'
  ): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    tournament.status = status;

    return await this.tournamentRepository.save(tournament);
  }

  /**
   * Получить турнир по ID
   */
  async getTournamentById(tournamentId: string): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['series', 'registrations'],
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    return tournament;
  }

      /**
   * Отменить регистрацию на турнир
   */
  async unregisterFromTournament(
    userId: string,
    tournamentId: string
  ): Promise<void> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Проверка статуса турнира
    if (tournament.status !== 'REG_OPEN') {
      throw new Error('Cannot unregister from started or completed tournament');
    }

    const playerProfile = await this.playerRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'balance'],
    });

    if (!playerProfile) {
      throw new Error('Player profile not found');
    }

    // Найти регистрацию
    const registration = await this.registrationRepository.findOne({
      where: {
        tournament: { id: tournamentId },
        player: { id: playerProfile.id },
      },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    // Вернуть деньги на баланс (если оплачено депозитом)
    if (registration.paymentMethod === 'DEPOSIT') {
      if (!playerProfile.balance) {
        throw new Error('Player balance not found. Cannot refund.');
      }

      const balance = playerProfile.balance;
      balance.depositBalance += tournament.buyInAmount;
      
      // Сохранить баланс
      await AppDataSource.getRepository('PlayerBalance').save(balance);

      // Создать операцию возврата
      const operationRepository = AppDataSource.getRepository('PlayerOperation');
      const refundOperation = operationRepository.create({
        playerProfile,
        operationType: 'REFUND',
        amount: tournament.buyInAmount,
      });
      await operationRepository.save(refundOperation);
    }

    // Удалить регистрацию
    await this.registrationRepository.remove(registration);
  }



}
