import { AppDataSource } from '../config/database';
import { Tournament } from '../models/Tournament';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { PlayerOperation } from '../models/PlayerOperation';
import { Order } from '../models/Order';
import { OrderStatus } from '../models/Order';
import { TournamentPayment } from '../models/TournamentPayment';

export interface TournamentPlayerBalance {
  playerId: string;
  playerName: string;
  clubCardNumber?: string;
  balance: number;
  buyInAmount: number;
  rebuysAmount: number;
  rebuyCount: number;
  addonsAmount: number;
  addonCount: number;
  ordersAmount: number;
  paidAmount: number;
}

export class TournamentBalanceService {
  private tournamentRepo = AppDataSource.getRepository(Tournament);
  private registrationRepo = AppDataSource.getRepository(TournamentRegistration);
  private operationRepo = AppDataSource.getRepository(PlayerOperation);
  private orderRepo = AppDataSource.getRepository(Order);
  private paymentRepo = AppDataSource.getRepository(TournamentPayment);

  /**
   * Баланс игрока = вход + ребаи + аддоны + заказы - оплаты
   */
  async getTournamentPlayerBalances(
    tournamentId: string
  ): Promise<TournamentPlayerBalance[]> {
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });
    if (!tournament) throw new Error('Tournament not found');

    const registrations = await this.registrationRepo.find({
      where: { tournament: { id: tournamentId } },
      relations: ['player', 'player.user'],
    });

    const result: TournamentPlayerBalance[] = [];

    for (const reg of registrations) {
      const player = reg.player;
      // Турнирные суммы в рублях, заказы в копейках — приводим всё к копейкам
    const buyInKopecks = (tournament.buyInCost ?? 0) * 100;

      const rebuyOps = await this.operationRepo.find({
        where: {
          playerProfile: { id: player.id },
          tournament: { id: tournamentId },
          operationType: 'REBUY',
        },
      });
      const rebuysKopecks = rebuyOps.reduce((s, o) => s + o.amount * 100, 0);
      const rebuyCount = rebuyOps.length;

      const addonOps = await this.operationRepo.find({
        where: {
          playerProfile: { id: player.id },
          tournament: { id: tournamentId },
          operationType: 'ADDON',
        },
      });
      const addonsKopecks = addonOps.reduce((s, o) => s + o.amount * 100, 0);
      const addonCount = addonOps.length;

      let ordersKopecks = 0;
      if (player.user?.id) {
        const orders = await this.orderRepo.find({
          where: {
            userId: player.user.id,
            tournamentId,
          },
        });
        ordersKopecks = orders
          .filter(
            (o) =>
              o.status !== OrderStatus.CANCELLED &&
              (o.status === OrderStatus.DELIVERED ||
                o.status === OrderStatus.READY ||
                o.status === OrderStatus.PREPARING ||
                o.status === OrderStatus.PENDING)
          )
          .reduce((s, o) => s + o.totalAmount, 0);
      }

      const payments = await this.paymentRepo.find({
        where: {
          playerProfileId: player.id,
          tournamentId,
        },
      });
      const paidAmount = payments.reduce(
        (s, p) => s + p.cashAmount + p.nonCashAmount,
        0
      );

      const balance =
        buyInKopecks + rebuysKopecks + addonsKopecks + ordersKopecks - paidAmount;

      const playerName = player.user?.name?.trim() || 'Игрок';
      const clubCardNumber = player.user?.clubCardNumber;

      result.push({
        playerId: player.id,
        playerName,
        clubCardNumber,
        balance,
        buyInAmount: buyInKopecks,
        rebuysAmount: rebuysKopecks,
        rebuyCount,
        addonsAmount: addonsKopecks,
        addonCount,
        ordersAmount: ordersKopecks,
        paidAmount,
      });
    }

    return result;
  }

  async recordPayment(
    tournamentId: string,
    playerProfileId: string,
    cashAmount: number,
    nonCashAmount: number
  ): Promise<TournamentPayment> {
    const total = cashAmount + nonCashAmount;
    if (total <= 0) throw new Error('Сумма оплаты должна быть больше 0');

    const balances = await this.getTournamentPlayerBalances(tournamentId);
    const player = balances.find((b) => b.playerId === playerProfileId);
    if (!player) throw new Error('Игрок не найден в турнире');

    // Оплата — это запись факта внесения средств в реальной жизни, без проверки «достаточности»

    const payment = this.paymentRepo.create({
      playerProfileId,
      tournamentId,
      cashAmount,
      nonCashAmount,
    });
    return this.paymentRepo.save(payment);
  }
}
