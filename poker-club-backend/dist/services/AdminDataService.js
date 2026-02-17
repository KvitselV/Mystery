"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminDataService = void 0;
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const Club_1 = require("../models/Club");
const ClubSchedule_1 = require("../models/ClubSchedule");
const ClubTable_1 = require("../models/ClubTable");
const PlayerProfile_1 = require("../models/PlayerProfile");
const PlayerBalance_1 = require("../models/PlayerBalance");
const Tournament_1 = require("../models/Tournament");
const TournamentSeries_1 = require("../models/TournamentSeries");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const TournamentResult_1 = require("../models/TournamentResult");
const TournamentTable_1 = require("../models/TournamentTable");
const TableSeat_1 = require("../models/TableSeat");
const TournamentLiveState_1 = require("../models/TournamentLiveState");
const TournamentLevel_1 = require("../models/TournamentLevel");
const TournamentAdminReport_1 = require("../models/TournamentAdminReport");
const TournamentPayment_1 = require("../models/TournamentPayment");
const TournamentReward_1 = require("../models/TournamentReward");
const PlayerOperation_1 = require("../models/PlayerOperation");
const BlindStructure_1 = require("../models/BlindStructure");
const MenuCategory_1 = require("../models/MenuCategory");
const MenuItem_1 = require("../models/MenuItem");
const Order_1 = require("../models/Order");
const OrderItem_1 = require("../models/OrderItem");
const PlayerBill_1 = require("../models/PlayerBill");
const AchievementType_1 = require("../models/AchievementType");
const AchievementInstance_1 = require("../models/AchievementInstance");
const Leaderboard_1 = require("../models/Leaderboard");
const LeaderboardEntry_1 = require("../models/LeaderboardEntry");
const Reward_1 = require("../models/Reward");
function toPlain(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (Array.isArray(obj))
        return obj.map(toPlain);
    if (obj instanceof Date)
        return obj.toISOString();
    if (typeof obj === 'object' && obj !== null) {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            if (v === undefined)
                continue;
            if (k === 'passwordHash')
                continue;
            out[k] = toPlain(v);
        }
        return out;
    }
    return obj;
}
class AdminDataService {
    async getAllData() {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const clubRepo = database_1.AppDataSource.getRepository(Club_1.Club);
        const clubScheduleRepo = database_1.AppDataSource.getRepository(ClubSchedule_1.ClubSchedule);
        const clubTableRepo = database_1.AppDataSource.getRepository(ClubTable_1.ClubTable);
        const playerProfileRepo = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        const playerBalanceRepo = database_1.AppDataSource.getRepository(PlayerBalance_1.PlayerBalance);
        const tournamentRepo = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        const seriesRepo = database_1.AppDataSource.getRepository(TournamentSeries_1.TournamentSeries);
        const regRepo = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        const resultRepo = database_1.AppDataSource.getRepository(TournamentResult_1.TournamentResult);
        const tournamentTableRepo = database_1.AppDataSource.getRepository(TournamentTable_1.TournamentTable);
        const seatRepo = database_1.AppDataSource.getRepository(TableSeat_1.TableSeat);
        const liveStateRepo = database_1.AppDataSource.getRepository(TournamentLiveState_1.TournamentLiveState);
        const levelRepo = database_1.AppDataSource.getRepository(TournamentLevel_1.TournamentLevel);
        const adminReportRepo = database_1.AppDataSource.getRepository(TournamentAdminReport_1.TournamentAdminReport);
        const paymentRepo = database_1.AppDataSource.getRepository(TournamentPayment_1.TournamentPayment);
        const rewardRepo = database_1.AppDataSource.getRepository(TournamentReward_1.TournamentReward);
        const opRepo = database_1.AppDataSource.getRepository(PlayerOperation_1.PlayerOperation);
        const blindRepo = database_1.AppDataSource.getRepository(BlindStructure_1.BlindStructure);
        const menuCatRepo = database_1.AppDataSource.getRepository(MenuCategory_1.MenuCategory);
        const menuItemRepo = database_1.AppDataSource.getRepository(MenuItem_1.MenuItem);
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const orderItemRepo = database_1.AppDataSource.getRepository(OrderItem_1.OrderItem);
        const billRepo = database_1.AppDataSource.getRepository(PlayerBill_1.PlayerBill);
        const achievementTypeRepo = database_1.AppDataSource.getRepository(AchievementType_1.AchievementType);
        const achievementInstanceRepo = database_1.AppDataSource.getRepository(AchievementInstance_1.AchievementInstance);
        const leaderboardRepo = database_1.AppDataSource.getRepository(Leaderboard_1.Leaderboard);
        const leaderboardEntryRepo = database_1.AppDataSource.getRepository(LeaderboardEntry_1.LeaderboardEntry);
        const rewardModelRepo = database_1.AppDataSource.getRepository(Reward_1.Reward);
        const [users, clubs, clubSchedules, clubTables, playerProfiles, playerBalances, tournaments, series, registrations, results, tournamentTables, seats, liveStates, levels, adminReports, payments, tournamentRewards, operations, blindStructures, menuCategories, menuItems, orders, orderItems, bills, achievementTypes, achievementInstances, leaderboards, leaderboardEntries, rewards,] = await Promise.all([
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
            users: users.map((u) => toPlain(u)),
            clubs: clubs.map((c) => toPlain(c)),
            clubSchedules: clubSchedules.map((s) => toPlain(s)),
            clubTables: clubTables.map((t) => toPlain(t)),
            playerProfiles: playerProfiles.map((p) => toPlain(p)),
            playerBalances: playerBalances.map((b) => toPlain(b)),
            tournaments: tournaments.map((t) => toPlain(t)),
            tournamentSeries: series.map((s) => toPlain(s)),
            tournamentRegistrations: registrations.map((r) => toPlain(r)),
            tournamentResults: results.map((r) => toPlain(r)),
            tournamentTables: tournamentTables.map((t) => toPlain(t)),
            tableSeats: seats.map((s) => toPlain(s)),
            tournamentLiveStates: liveStates.map((ls) => toPlain(ls)),
            tournamentLevels: levels.map((l) => toPlain(l)),
            tournamentAdminReports: adminReports.map((r) => toPlain(r)),
            tournamentPayments: payments.map((p) => toPlain(p)),
            tournamentRewards: tournamentRewards.map((r) => toPlain(r)),
            playerOperations: operations.map((o) => toPlain(o)),
            blindStructures: blindStructures.map((b) => toPlain(b)),
            menuCategories: menuCategories.map((c) => toPlain(c)),
            menuItems: menuItems.map((i) => toPlain(i)),
            orders: orders.map((o) => toPlain(o)),
            orderItems: orderItems.map((i) => toPlain(i)),
            playerBills: bills.map((b) => toPlain(b)),
            achievementTypes: achievementTypes.map((a) => toPlain(a)),
            achievementInstances: achievementInstances.map((a) => toPlain(a)),
            leaderboards: leaderboards.map((l) => toPlain(l)),
            leaderboardEntries: leaderboardEntries.map((e) => toPlain(e)),
            rewards: rewards.map((r) => toPlain(r)),
        };
    }
    async updateEntity(table, id, data) {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const clubRepo = database_1.AppDataSource.getRepository(Club_1.Club);
        const clubScheduleRepo = database_1.AppDataSource.getRepository(ClubSchedule_1.ClubSchedule);
        const tournamentRepo = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        const seriesRepo = database_1.AppDataSource.getRepository(TournamentSeries_1.TournamentSeries);
        const regRepo = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        const menuCatRepo = database_1.AppDataSource.getRepository(MenuCategory_1.MenuCategory);
        const menuItemRepo = database_1.AppDataSource.getRepository(MenuItem_1.MenuItem);
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const billRepo = database_1.AppDataSource.getRepository(PlayerBill_1.PlayerBill);
        const adminReportRepo = database_1.AppDataSource.getRepository(TournamentAdminReport_1.TournamentAdminReport);
        const rewardModelRepo = database_1.AppDataSource.getRepository(Reward_1.Reward);
        switch (table) {
            case 'users': {
                const user = await userRepo.findOne({ where: { id } });
                if (!user)
                    throw new Error('User not found');
                if (data.role != null)
                    user.role = data.role;
                if (data.isActive != null)
                    user.isActive = Boolean(data.isActive);
                if (data.managedClubId !== undefined)
                    user.managedClubId = data.managedClubId;
                return userRepo.save(user);
            }
            case 'clubs': {
                const club = await clubRepo.findOne({ where: { id } });
                if (!club)
                    throw new Error('Club not found');
                if (data.name != null)
                    club.name = String(data.name);
                if (data.description !== undefined)
                    Object.assign(club, { description: data.description });
                if (data.address !== undefined)
                    Object.assign(club, { address: data.address });
                if (data.phone !== undefined)
                    Object.assign(club, { phone: data.phone });
                if (data.tableCount != null)
                    club.tableCount = Number(data.tableCount);
                if (data.isActive !== undefined)
                    club.isActive = Boolean(data.isActive);
                return clubRepo.save(club);
            }
            case 'clubSchedules': {
                const sched = await clubScheduleRepo.findOne({ where: { id } });
                if (!sched)
                    throw new Error('Schedule not found');
                if (data.dayOfWeek != null)
                    sched.dayOfWeek = Number(data.dayOfWeek);
                if (data.startTime != null)
                    sched.startTime = data.startTime;
                if (data.endTime != null)
                    sched.endTime = data.endTime;
                if (data.eventType !== undefined)
                    Object.assign(sched, { eventType: data.eventType });
                if (data.description !== undefined)
                    Object.assign(sched, { description: data.description });
                return clubScheduleRepo.save(sched);
            }
            case 'tournaments': {
                const t = await tournamentRepo.findOne({ where: { id }, relations: ['club', 'series'] });
                if (!t)
                    throw new Error('Tournament not found');
                if (data.name != null)
                    t.name = String(data.name);
                if (data.status != null)
                    t.status = String(data.status);
                if (data.startTime != null)
                    t.startTime = new Date(data.startTime);
                if (data.buyInCost != null)
                    t.buyInCost = Number(data.buyInCost);
                if (data.startingStack != null)
                    t.startingStack = Number(data.startingStack);
                if (data.addonChips !== undefined)
                    t.addonChips = Number(data.addonChips);
                if (data.addonCost !== undefined)
                    t.addonCost = Number(data.addonCost);
                if (data.rebuyChips !== undefined)
                    t.rebuyChips = Number(data.rebuyChips);
                if (data.rebuyCost !== undefined)
                    t.rebuyCost = Number(data.rebuyCost);
                if (data.maxRebuys !== undefined)
                    t.maxRebuys = Number(data.maxRebuys);
                if (data.maxAddons !== undefined)
                    t.maxAddons = Number(data.maxAddons);
                if (data.clubId !== undefined)
                    Object.assign(t, { clubId: data.clubId });
                if (data.seriesId !== undefined) {
                    Object.assign(t, { series: data.seriesId ? { id: data.seriesId } : null });
                }
                if (data.blindStructureId !== undefined)
                    Object.assign(t, { blindStructureId: data.blindStructureId });
                return tournamentRepo.save(t);
            }
            case 'tournamentSeries': {
                const s = await seriesRepo.findOne({ where: { id } });
                if (!s)
                    throw new Error('Series not found');
                if (data.name != null)
                    s.name = String(data.name);
                if (data.periodStart != null)
                    s.periodStart = new Date(data.periodStart);
                if (data.periodEnd != null)
                    s.periodEnd = new Date(data.periodEnd);
                if (data.daysOfWeek != null)
                    s.daysOfWeek = Array.isArray(data.daysOfWeek) ? data.daysOfWeek.join(',') : s.daysOfWeek;
                return seriesRepo.save(s);
            }
            case 'tournamentRegistrations': {
                const reg = await regRepo.findOne({ where: { id } });
                if (!reg)
                    throw new Error('Registration not found');
                if (data.isArrived !== undefined)
                    reg.isArrived = Boolean(data.isArrived);
                if (data.isActive !== undefined)
                    reg.isActive = Boolean(data.isActive);
                if (data.currentStack != null)
                    reg.currentStack = Number(data.currentStack);
                return regRepo.save(reg);
            }
            case 'menuCategories': {
                const cat = await menuCatRepo.findOne({ where: { id } });
                if (!cat)
                    throw new Error('Category not found');
                if (data.name != null)
                    cat.name = String(data.name);
                return menuCatRepo.save(cat);
            }
            case 'menuItems': {
                const item = await menuItemRepo.findOne({ where: { id }, relations: ['category'] });
                if (!item)
                    throw new Error('Item not found');
                if (data.name != null)
                    item.name = String(data.name);
                if (data.price != null)
                    item.price = Number(data.price);
                if (data.categoryId != null)
                    item.categoryId = data.categoryId;
                return menuItemRepo.save(item);
            }
            case 'orders': {
                const order = await orderRepo.findOne({ where: { id } });
                if (!order)
                    throw new Error('Order not found');
                if (data.status != null)
                    order.status = data.status;
                return orderRepo.save(order);
            }
            case 'playerBills': {
                const bill = await billRepo.findOne({ where: { id } });
                if (!bill)
                    throw new Error('Bill not found');
                if (data.status != null)
                    bill.status = data.status;
                return billRepo.save(bill);
            }
            case 'tournamentAdminReports': {
                const report = await adminReportRepo.findOne({ where: { id } });
                if (!report)
                    throw new Error('Report not found');
                if (data.attendanceCount != null)
                    report.attendanceCount = Number(data.attendanceCount);
                if (data.cashRevenue != null)
                    report.cashRevenue = Number(data.cashRevenue);
                if (data.nonCashRevenue != null)
                    report.nonCashRevenue = Number(data.nonCashRevenue);
                if (data.expenses != null)
                    report.expenses = data.expenses;
                const expTotal = (report.expenses ?? []).reduce((s, e) => s + (e?.amount ?? 0), 0);
                report.totalProfit = (report.cashRevenue ?? 0) + (report.nonCashRevenue ?? 0) - expTotal;
                return adminReportRepo.save(report);
            }
            case 'rewards': {
                const r = await rewardModelRepo.findOne({ where: { id } });
                if (!r)
                    throw new Error('Reward not found');
                if (data.name != null)
                    r.name = String(data.name);
                if (data.description !== undefined)
                    Object.assign(r, { description: data.description });
                if (data.isActive !== undefined)
                    r.isActive = Boolean(data.isActive);
                return rewardModelRepo.save(r);
            }
            default:
                throw new Error(`Table "${table}" is not editable or does not exist`);
        }
    }
}
exports.AdminDataService = AdminDataService;
//# sourceMappingURL=AdminDataService.js.map