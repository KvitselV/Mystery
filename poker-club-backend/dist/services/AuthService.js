"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const PlayerProfile_1 = require("../models/PlayerProfile");
const PlayerBalance_1 = require("../models/PlayerBalance");
const bcrypt_1 = __importDefault(require("bcrypt"));
class AuthService {
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
        this.playerRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.balanceRepository = database_1.AppDataSource.getRepository(PlayerBalance_1.PlayerBalance);
    }
    async register(data) {
        // Провери, что пользователь с таким номером не существует
        const existingUser = await this.userRepository.findOne({
            where: { phone: data.phone },
        });
        if (existingUser) {
            throw new Error('User with this phone already exists');
        }
        // Хеш пароля
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        // Проверь, что номер клубной карты не занят
        const existingByCard = await this.userRepository.findOne({ where: { clubCardNumber: data.clubCardNumber } });
        if (existingByCard) {
            throw new Error('Пользователь с таким номером клубной карты уже существует');
        }
        // Создай пользователя
        const user = this.userRepository.create({
            name: data.name,
            clubCardNumber: data.clubCardNumber,
            phone: data.phone,
            passwordHash,
            role: 'PLAYER',
            isActive: true,
        });
        const savedUser = await this.userRepository.save(user);
        // Создай баланс
        const balance = this.balanceRepository.create({
            depositBalance: 0,
            totalDeposited: 0,
        });
        const savedBalance = await this.balanceRepository.save(balance);
        // Создай профиль игрока с балансом
        const playerProfile = this.playerRepository.create({
            user: savedUser,
            balance: savedBalance,
            mmrValue: 0,
            rankCode: 'E',
            tournamentsCount: 0,
            winRate: 0,
            averageFinish: 0,
        });
        await this.playerRepository.save(playerProfile);
        return {
            user: {
                id: savedUser.id,
                name: savedUser.name,
                clubCardNumber: savedUser.clubCardNumber,
                phone: savedUser.phone,
                role: savedUser.role,
            },
        };
    }
    /** Создать пользователя без токенов (для регистрации гостя админом). Возвращает playerProfileId. */
    async createUserAsGuest(data) {
        const existingUser = await this.userRepository.findOne({ where: { phone: data.phone } });
        if (existingUser)
            throw new Error('Пользователь с таким телефоном уже существует');
        const existingByCard = await this.userRepository.findOne({ where: { clubCardNumber: data.clubCardNumber } });
        if (existingByCard)
            throw new Error('Пользователь с таким номером клубной карты уже существует');
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        const user = this.userRepository.create({
            name: data.name,
            clubCardNumber: data.clubCardNumber,
            phone: data.phone,
            passwordHash,
            role: 'PLAYER',
            isActive: true,
        });
        const savedUser = await this.userRepository.save(user);
        const balance = this.balanceRepository.create({ depositBalance: 0, totalDeposited: 0 });
        const savedBalance = await this.balanceRepository.save(balance);
        const playerProfile = this.playerRepository.create({
            user: savedUser,
            balance: savedBalance,
            mmrValue: 0,
            rankCode: 'E',
            tournamentsCount: 0,
            winRate: 0,
            averageFinish: 0,
        });
        const savedProfile = await this.playerRepository.save(playerProfile);
        return { userId: savedUser.id, playerProfileId: savedProfile.id };
    }
    async login(data) {
        const user = await this.userRepository.findOne({
            where: { phone: data.phone },
        });
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await bcrypt_1.default.compare(data.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }
        if (!user.isActive) {
            throw new Error('User account is inactive');
        }
        const managedClubId = user.role === 'CONTROLLER' ? user.managedClubId ?? null : undefined;
        return {
            user: {
                id: user.id,
                name: user.name,
                clubCardNumber: user.clubCardNumber,
                phone: user.phone,
                role: user.role,
                ...(managedClubId !== undefined && { managedClubId }),
            },
        };
    }
    async getUserById(userId) {
        return this.userRepository.findOne({
            where: { id: userId },
            relations: ['managedClub'],
            select: ['id', 'name', 'clubCardNumber', 'phone', 'role', 'isActive', 'createdAt', 'managedClubId', 'avatarUrl'],
        });
    }
    async updateProfile(userId, data) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        if (data.name != null)
            user.name = data.name.trim();
        if (data.phone != null) {
            const existing = await this.userRepository.findOne({ where: { phone: data.phone } });
            if (existing && existing.id !== userId)
                throw new Error('Пользователь с таким телефоном уже существует');
            user.phone = data.phone.trim();
        }
        if ('avatarUrl' in data)
            user.avatarUrl = data.avatarUrl ?? null;
        return this.userRepository.save(user);
    }
    async getAllUsers() {
        const users = await this.userRepository.find({
            relations: ['managedClub'],
            select: ['id', 'name', 'clubCardNumber', 'phone', 'role', 'managedClubId'],
            order: { createdAt: 'DESC' },
        });
        return users.map((u) => ({
            id: u.id,
            name: u.name,
            clubCardNumber: u.clubCardNumber,
            phone: u.phone,
            role: u.role,
            managedClubId: u.managedClubId,
            managedClub: u.managedClub ? { id: u.managedClub.id, name: u.managedClub.name } : null,
        }));
    }
    async assignControllerToClub(controllerUserId, clubId) {
        const user = await this.userRepository.findOne({ where: { id: controllerUserId } });
        if (!user)
            throw new Error('User not found');
        if (user.role !== 'CONTROLLER')
            throw new Error('User is not a controller');
        user.managedClubId = clubId;
        await this.userRepository.save(user);
        return { managedClubId: clubId };
    }
    async promoteToController(adminUserId, targetUserId, clubId) {
        const admin = await this.userRepository.findOne({ where: { id: adminUserId } });
        if (!admin || admin.role !== 'ADMIN')
            return null;
        const target = await this.userRepository.findOne({ where: { id: targetUserId } });
        if (!target)
            return null;
        target.role = 'CONTROLLER';
        target.managedClubId = clubId;
        await this.userRepository.save(target);
        return {
            user: { id: target.id, name: target.name, clubCardNumber: target.clubCardNumber, phone: target.phone, role: target.role, managedClubId: clubId },
        };
    }
    async promoteToAdmin(userId) {
        if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROMOTE_ADMIN) {
            return null;
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            return null;
        user.role = 'ADMIN';
        await this.userRepository.save(user);
        return {
            user: { id: user.id, name: user.name, clubCardNumber: user.clubCardNumber, phone: user.phone, role: user.role },
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map