import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Club } from '../models/Club';
import { ClubSchedule } from '../models/ClubSchedule';
import { ClubTable } from '../models/ClubTable';
import { PlayerProfile } from '../models/PlayerProfile';
import { PlayerBalance } from '../models/PlayerBalance';
import { Tournament } from '../models/Tournament';
import { TournamentSeries } from '../models/TournamentSeries';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { TournamentResult } from '../models/TournamentResult';
import { TournamentTable } from '../models/TournamentTable';
import { TableSeat } from '../models/TableSeat';
import { TournamentLiveState } from '../models/TournamentLiveState';
import { TournamentLevel } from '../models/TournamentLevel';
import { TournamentAdminReport } from '../models/TournamentAdminReport';
import { TournamentPayment } from '../models/TournamentPayment';
import { TournamentReward } from '../models/TournamentReward';
import { PlayerOperation } from '../models/PlayerOperation';
import { BlindStructure } from '../models/BlindStructure';
import { MenuCategory } from '../models/MenuCategory';
import { MenuItem } from '../models/MenuItem';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { PlayerBill } from '../models/PlayerBill';
import { AchievementType } from '../models/AchievementType';
import { AchievementInstance } from '../models/AchievementInstance';
import { Leaderboard } from '../models/Leaderboard';
import { LeaderboardEntry } from '../models/LeaderboardEntry';
import { Reward } from '../models/Reward';
import { OrderStatus } from '../models/Order';
import { PlayerBillStatus } from '../models/PlayerBill';

type UserRole = 'ADMIN' | 'CONTROLLER' | 'PLAYER' | 'WAITER' | 'TV';

function toPlain(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toPlain);
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === 'object' && obj !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      if (k === 'passwordHash') continue;
      out[k] = toPlain(v);
    }
    return out;
  }
  return obj;
}

export class AdminDataService {
  async getAllData(): Promise<Record<string, unknown[]>> {
    const userRepo = AppDataSource.getRepository(User);
    const clubRepo = AppDataSource.getRepository(Club);
    const clubScheduleRepo = AppDataSource.getRepository(ClubSchedule);
    const clubTableRepo = AppDataSource.getRepository(ClubTable);
    const playerProfileRepo = AppDataSource.getRepository(PlayerProfile);
    const playerBalanceRepo = AppDataSource.getRepository(PlayerBalance);
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const seriesRepo = AppDataSource.getRepository(TournamentSeries);
    const regRepo = AppDataSource.getRepository(TournamentRegistration);
    const resultRepo = AppDataSource.getRepository(TournamentResult);
    const tournamentTableRepo = AppDataSource.getRepository(TournamentTable);
    const seatRepo = AppDataSource.getRepository(TableSeat);
    const liveStateRepo = AppDataSource.getRepository(TournamentLiveState);
    const levelRepo = AppDataSource.getRepository(TournamentLevel);
    const adminReportRepo = AppDataSource.getRepository(TournamentAdminReport);
    const paymentRepo = AppDataSource.getRepository(TournamentPayment);
    const rewardRepo = AppDataSource.getRepository(TournamentReward);
    const opRepo = AppDataSource.getRepository(PlayerOperation);
    const blindRepo = AppDataSource.getRepository(BlindStructure);
    const menuCatRepo = AppDataSource.getRepository(MenuCategory);
    const menuItemRepo = AppDataSource.getRepository(MenuItem);
    const orderRepo = AppDataSource.getRepository(Order);
    const orderItemRepo = AppDataSource.getRepository(OrderItem);
    const billRepo = AppDataSource.getRepository(PlayerBill);
    const achievementTypeRepo = AppDataSource.getRepository(AchievementType);
    const achievementInstanceRepo = AppDataSource.getRepository(AchievementInstance);
    const leaderboardRepo = AppDataSource.getRepository(Leaderboard);
    const leaderboardEntryRepo = AppDataSource.getRepository(LeaderboardEntry);
    const rewardModelRepo = AppDataSource.getRepository(Reward);

    const [
      users,
      clubs,
      clubSchedules,
      clubTables,
      playerProfiles,
      playerBalances,
      tournaments,
      series,
      registrations,
      results,
      tournamentTables,
      seats,
      liveStates,
      levels,
      adminReports,
      payments,
      tournamentRewards,
      operations,
      blindStructures,
      menuCategories,
      menuItems,
      orders,
      orderItems,
      bills,
      achievementTypes,
      achievementInstances,
      leaderboards,
      leaderboardEntries,
      rewards,
    ] = await Promise.all([
      userRepo.find({
        select: ['id', 'name', 'clubCardNumber', 'phone', 'role', 'managedClubId', 'isActive', 'createdAt', 'updatedAt'],
        relations: ['managedClub'],
      }),
      clubRepo.find(),
      clubScheduleRepo.find({ relations: ['club'] }),
      clubTableRepo.find({ relations: ['club'] }),
      playerProfileRepo.find({ relations: ['user', 'balance'], select: { user: { id: true, name: true, clubCardNumber: true } } }),
      playerBalanceRepo.find(),
      tournamentRepo.find({ relations: ['club', 'series', 'blindStructure'] }),
      seriesRepo.find({ relations: ['club'] }),
      regRepo.find({ relations: ['tournament', 'player'], select: { tournament: { id: true, name: true }, player: { id: true } } }),
      resultRepo.find({ relations: ['tournament', 'player'], select: { tournament: { id: true, name: true }, player: { id: true } } }),
      tournamentTableRepo.find({ relations: ['tournament', 'seats', 'clubTable'] }),
      seatRepo.find({ relations: ['table', 'player'], select: { table: { id: true }, player: { id: true } } }),
      liveStateRepo.find({ relations: ['tournament'] }),
      levelRepo.find({ relations: ['blindStructure'] }),
      adminReportRepo.find(),
      paymentRepo.find({ relations: ['playerProfile', 'tournament'], select: { playerProfile: { id: true }, tournament: { id: true, name: true } } }),
      rewardRepo.find({ relations: ['tournament', 'reward'] }),
      opRepo.find({ relations: ['playerProfile', 'tournament'], select: { playerProfile: { id: true }, tournament: { id: true } } }),
      blindRepo.find({ relations: ['club', 'levels'] }),
      menuCatRepo.find(),
      menuItemRepo.find({ relations: ['category'] }),
      orderRepo.find({ relations: ['user', 'tournament', 'items'], select: { user: { id: true, name: true }, tournament: { id: true, name: true } } }),
      orderItemRepo.find({ relations: ['order', 'menuItem'] }),
      billRepo.find({ relations: ['playerProfile', 'tournament'], select: { playerProfile: { id: true }, tournament: { id: true } } }),
      achievementTypeRepo.find(),
      achievementInstanceRepo.find({ relations: ['user', 'achievementType'], select: { user: { id: true, name: true } } }),
      leaderboardRepo.find(),
      leaderboardEntryRepo.find({ relations: ['leaderboard', 'playerProfile'], select: { playerProfile: { id: true } } }),
      rewardModelRepo.find(),
    ]);

    return {
      users: users.map((u) => toPlain(u)) as unknown[],
      clubs: clubs.map((c) => toPlain(c)) as unknown[],
      clubSchedules: clubSchedules.map((s) => toPlain(s)) as unknown[],
      clubTables: clubTables.map((t) => toPlain(t)) as unknown[],
      playerProfiles: playerProfiles.map((p) => toPlain(p)) as unknown[],
      playerBalances: playerBalances.map((b) => toPlain(b)) as unknown[],
      tournaments: tournaments.map((t) => toPlain(t)) as unknown[],
      tournamentSeries: series.map((s) => toPlain(s)) as unknown[],
      tournamentRegistrations: registrations.map((r) => toPlain(r)) as unknown[],
      tournamentResults: results.map((r) => toPlain(r)) as unknown[],
      tournamentTables: tournamentTables.map((t) => toPlain(t)) as unknown[],
      tableSeats: seats.map((s) => toPlain(s)) as unknown[],
      tournamentLiveStates: liveStates.map((ls) => toPlain(ls)) as unknown[],
      tournamentLevels: levels.map((l) => toPlain(l)) as unknown[],
      tournamentAdminReports: adminReports.map((r) => toPlain(r)) as unknown[],
      tournamentPayments: payments.map((p) => toPlain(p)) as unknown[],
      tournamentRewards: tournamentRewards.map((r) => toPlain(r)) as unknown[],
      playerOperations: operations.map((o) => toPlain(o)) as unknown[],
      blindStructures: blindStructures.map((b) => toPlain(b)) as unknown[],
      menuCategories: menuCategories.map((c) => toPlain(c)) as unknown[],
      menuItems: menuItems.map((i) => toPlain(i)) as unknown[],
      orders: orders.map((o) => toPlain(o)) as unknown[],
      orderItems: orderItems.map((i) => toPlain(i)) as unknown[],
      playerBills: bills.map((b) => toPlain(b)) as unknown[],
      achievementTypes: achievementTypes.map((a) => toPlain(a)) as unknown[],
      achievementInstances: achievementInstances.map((a) => toPlain(a)) as unknown[],
      leaderboards: leaderboards.map((l) => toPlain(l)) as unknown[],
      leaderboardEntries: leaderboardEntries.map((e) => toPlain(e)) as unknown[],
      rewards: rewards.map((r) => toPlain(r)) as unknown[],
    };
  }

  async updateEntity(table: string, id: string, data: Record<string, unknown>): Promise<unknown> {
    const userRepo = AppDataSource.getRepository(User);
    const clubRepo = AppDataSource.getRepository(Club);
    const clubScheduleRepo = AppDataSource.getRepository(ClubSchedule);
    const tournamentRepo = AppDataSource.getRepository(Tournament);
    const seriesRepo = AppDataSource.getRepository(TournamentSeries);
    const regRepo = AppDataSource.getRepository(TournamentRegistration);
    const menuCatRepo = AppDataSource.getRepository(MenuCategory);
    const menuItemRepo = AppDataSource.getRepository(MenuItem);
    const orderRepo = AppDataSource.getRepository(Order);
    const billRepo = AppDataSource.getRepository(PlayerBill);
    const adminReportRepo = AppDataSource.getRepository(TournamentAdminReport);
    const rewardModelRepo = AppDataSource.getRepository(Reward);

    switch (table) {
      case 'users': {
        const user = await userRepo.findOne({ where: { id } });
        if (!user) throw new Error('User not found');
        if (data.role != null) user.role = data.role as UserRole;
        if (data.isActive != null) user.isActive = Boolean(data.isActive);
        if (data.managedClubId !== undefined) user.managedClubId = data.managedClubId as string | null;
        return userRepo.save(user);
      }
      case 'clubs': {
        const club = await clubRepo.findOne({ where: { id } });
        if (!club) throw new Error('Club not found');
        if (data.name != null) club.name = String(data.name);
        if (data.description !== undefined) Object.assign(club, { description: data.description });
        if (data.address !== undefined) Object.assign(club, { address: data.address });
        if (data.phone !== undefined) Object.assign(club, { phone: data.phone });
        if (data.tableCount != null) club.tableCount = Number(data.tableCount);
        if (data.isActive !== undefined) club.isActive = Boolean(data.isActive);
        return clubRepo.save(club);
      }
      case 'clubSchedules': {
        const sched = await clubScheduleRepo.findOne({ where: { id } });
        if (!sched) throw new Error('Schedule not found');
        if (data.dayOfWeek != null) sched.dayOfWeek = Number(data.dayOfWeek);
        if (data.startTime != null) sched.startTime = data.startTime as string;
        if (data.endTime != null) sched.endTime = data.endTime as string;
        if (data.eventType !== undefined) Object.assign(sched, { eventType: data.eventType });
        if (data.description !== undefined) Object.assign(sched, { description: data.description });
        return clubScheduleRepo.save(sched);
      }
      case 'tournaments': {
        const t = await tournamentRepo.findOne({ where: { id }, relations: ['club', 'series'] });
        if (!t) throw new Error('Tournament not found');
        if (data.name != null) t.name = String(data.name);
        if (data.status != null) t.status = String(data.status);
        if (data.startTime != null) t.startTime = new Date(data.startTime as string);
        if (data.buyInCost != null) t.buyInCost = Number(data.buyInCost);
        if (data.startingStack != null) t.startingStack = Number(data.startingStack);
        if (data.addonChips !== undefined) t.addonChips = Number(data.addonChips);
        if (data.addonCost !== undefined) t.addonCost = Number(data.addonCost);
        if (data.rebuyChips !== undefined) t.rebuyChips = Number(data.rebuyChips);
        if (data.rebuyCost !== undefined) t.rebuyCost = Number(data.rebuyCost);
        if (data.maxRebuys !== undefined) t.maxRebuys = Number(data.maxRebuys);
        if (data.maxAddons !== undefined) t.maxAddons = Number(data.maxAddons);
        if (data.clubId !== undefined) Object.assign(t, { clubId: data.clubId });
        if (data.seriesId !== undefined) {
          Object.assign(t, { series: data.seriesId ? ({ id: data.seriesId } as import('../models/TournamentSeries').TournamentSeries) : null });
        }
        if (data.blindStructureId !== undefined) Object.assign(t, { blindStructureId: data.blindStructureId });
        return tournamentRepo.save(t);
      }
      case 'tournamentSeries': {
        const s = await seriesRepo.findOne({ where: { id } });
        if (!s) throw new Error('Series not found');
        if (data.name != null) s.name = String(data.name);
        if (data.periodStart != null) s.periodStart = new Date(data.periodStart as string);
        if (data.periodEnd != null) s.periodEnd = new Date(data.periodEnd as string);
        if (data.daysOfWeek != null) s.daysOfWeek = Array.isArray(data.daysOfWeek) ? (data.daysOfWeek as number[]).join(',') : s.daysOfWeek;
        return seriesRepo.save(s);
      }
      case 'tournamentRegistrations': {
        const reg = await regRepo.findOne({ where: { id } });
        if (!reg) throw new Error('Registration not found');
        if (data.isArrived !== undefined) reg.isArrived = Boolean(data.isArrived);
        if (data.isActive !== undefined) reg.isActive = Boolean(data.isActive);
        if (data.currentStack != null) reg.currentStack = Number(data.currentStack);
        return regRepo.save(reg);
      }
      case 'menuCategories': {
        const cat = await menuCatRepo.findOne({ where: { id } });
        if (!cat) throw new Error('Category not found');
        if (data.name != null) cat.name = String(data.name);
        return menuCatRepo.save(cat);
      }
      case 'menuItems': {
        const item = await menuItemRepo.findOne({ where: { id }, relations: ['category'] });
        if (!item) throw new Error('Item not found');
        if (data.name != null) item.name = String(data.name);
        if (data.price != null) item.price = Number(data.price);
        if (data.categoryId != null) item.categoryId = data.categoryId as string;
        return menuItemRepo.save(item);
      }
      case 'orders': {
        const order = await orderRepo.findOne({ where: { id } });
        if (!order) throw new Error('Order not found');
        if (data.status != null) order.status = data.status as OrderStatus;
        return orderRepo.save(order);
      }
      case 'playerBills': {
        const bill = await billRepo.findOne({ where: { id } });
        if (!bill) throw new Error('Bill not found');
        if (data.status != null) bill.status = data.status as PlayerBillStatus;
        return billRepo.save(bill);
      }
      case 'tournamentAdminReports': {
        const report = await adminReportRepo.findOne({ where: { id } });
        if (!report) throw new Error('Report not found');
        if (data.attendanceCount != null) report.attendanceCount = Number(data.attendanceCount);
        if (data.cashRevenue != null) report.cashRevenue = Number(data.cashRevenue);
        if (data.nonCashRevenue != null) report.nonCashRevenue = Number(data.nonCashRevenue);
        if (data.expenses != null) report.expenses = data.expenses as { description: string; amount: number }[];
        const expTotal = (report.expenses ?? []).reduce((s, e) => s + (e?.amount ?? 0), 0);
        report.totalProfit = (report.cashRevenue ?? 0) + (report.nonCashRevenue ?? 0) - expTotal;
        return adminReportRepo.save(report);
      }
      case 'rewards': {
        const r = await rewardModelRepo.findOne({ where: { id } });
        if (!r) throw new Error('Reward not found');
        if (data.name != null) r.name = String(data.name);
        if (data.description !== undefined) Object.assign(r, { description: data.description });
        if (data.isActive !== undefined) r.isActive = Boolean(data.isActive);
        return rewardModelRepo.save(r);
      }
      default:
        throw new Error(`Table "${table}" is not editable or does not exist`);
    }
  }
}
