import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { PlayerProfile } from '../models/PlayerProfile';
import { PlayerBalance } from '../models/PlayerBalance';
import { JwtService } from './JwtService';
import bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, AuthResponse } from '../types';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private playerRepository = AppDataSource.getRepository(PlayerProfile);
  private balanceRepository = AppDataSource.getRepository(PlayerBalance);
  private jwtService = new JwtService();

  async register(data: RegisterDto): Promise<AuthResponse> {
    // Провери, что пользователь с таким номером не существует
    const existingUser = await this.userRepository.findOne({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new Error('User with this phone already exists');
    }

    // Хеш пароля
    const passwordHash = await bcrypt.hash(data.password, 10);

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

    // Генерируй токены
    const accessToken = this.jwtService.generateAccessToken(savedUser.id, savedUser.role);
    const refreshToken = this.jwtService.generateRefreshToken(savedUser.id);

    return {
      accessToken,
      refreshToken,
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
  async createUserAsGuest(data: RegisterDto): Promise<{ userId: string; playerProfileId: string }> {
    const existingUser = await this.userRepository.findOne({ where: { phone: data.phone } });
    if (existingUser) throw new Error('Пользователь с таким телефоном уже существует');

    const existingByCard = await this.userRepository.findOne({ where: { clubCardNumber: data.clubCardNumber } });
    if (existingByCard) throw new Error('Пользователь с таким номером клубной карты уже существует');

    const passwordHash = await bcrypt.hash(data.password, 10);
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

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { phone: data.phone },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

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
        name: user.name,
        clubCardNumber: user.clubCardNumber,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
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
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }

  async getUserById(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['managedClub'],
      select: ['id', 'name', 'clubCardNumber', 'phone', 'role', 'isActive', 'createdAt', 'managedClubId'],
    });
  }

  async getAllUsers(): Promise<Array<{ id: string; name: string; clubCardNumber: string; phone: string; role: string; managedClubId: string | null; managedClub: { id: string; name: string } | null }>> {
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

  async assignControllerToClub(controllerUserId: string, clubId: string): Promise<{ managedClubId: string }> {
    const user = await this.userRepository.findOne({ where: { id: controllerUserId } });
    if (!user) throw new Error('User not found');
    if (user.role !== 'CONTROLLER') throw new Error('User is not a controller');
    user.managedClubId = clubId;
    await this.userRepository.save(user);
    return { managedClubId: clubId };
  }

  async promoteToController(adminUserId: string, targetUserId: string, clubId: string): Promise<AuthResponse | null> {
    const admin = await this.userRepository.findOne({ where: { id: adminUserId } });
    if (!admin || admin.role !== 'ADMIN') return null;
    const target = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!target) return null;
    target.role = 'CONTROLLER';
    target.managedClubId = clubId;
    await this.userRepository.save(target);
    const accessToken = this.jwtService.generateAccessToken(target.id, target.role);
    const refreshToken = this.jwtService.generateRefreshToken(target.id);
    return {
      accessToken,
      refreshToken,
      user: { id: target.id, name: target.name, clubCardNumber: target.clubCardNumber, phone: target.phone, role: target.role, managedClubId: clubId },
    };
  }

  async promoteToAdmin(userId: string): Promise<AuthResponse | null> {
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROMOTE_ADMIN) {
      return null;
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;
    user.role = 'ADMIN';
    await this.userRepository.save(user);
    const accessToken = this.jwtService.generateAccessToken(user.id, user.role);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, clubCardNumber: user.clubCardNumber, phone: user.phone, role: user.role },
    };
  }
}
