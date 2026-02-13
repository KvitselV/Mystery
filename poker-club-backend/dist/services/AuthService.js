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
const JwtService_1 = require("./JwtService");
const bcrypt_1 = __importDefault(require("bcrypt"));
class AuthService {
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
        this.playerRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.balanceRepository = database_1.AppDataSource.getRepository(PlayerBalance_1.PlayerBalance);
        this.jwtService = new JwtService_1.JwtService();
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
        // Создай пользователя
        const user = this.userRepository.create({
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
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
        // Генерируй токены
        const accessToken = this.jwtService.generateAccessToken(savedUser.id, savedUser.role);
        const refreshToken = this.jwtService.generateRefreshToken(savedUser.id);
        return {
            accessToken,
            refreshToken,
            user: {
                id: savedUser.id,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                phone: savedUser.phone,
                role: savedUser.role,
            },
        };
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
        const accessToken = this.jwtService.generateAccessToken(user.id, user.role);
        const refreshToken = this.jwtService.generateRefreshToken(user.id);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role,
            },
        };
    }
    async refreshAccessToken(refreshToken) {
        try {
            const payload = this.jwtService.verifyRefreshToken(refreshToken);
            const user = await this.userRepository.findOne({
                where: { id: payload.userId },
            });
            if (!user) {
                throw new Error('User not found');
            }
            const newAccessToken = this.jwtService.generateAccessToken(user.id, user.role);
            return { accessToken: newAccessToken };
        }
        catch (error) {
            throw new Error('Failed to refresh token');
        }
    }
    async getUserById(userId) {
        return this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'firstName', 'lastName', 'phone', 'email', 'role', 'isActive'],
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map