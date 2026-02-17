import { User } from '../models/User';
import { RegisterDto, LoginDto, AuthResponse } from '../types';
export declare class AuthService {
    private userRepository;
    private playerRepository;
    private balanceRepository;
    register(data: RegisterDto): Promise<AuthResponse>;
    /** Создать пользователя без токенов (для регистрации гостя админом). Возвращает playerProfileId. */
    createUserAsGuest(data: RegisterDto): Promise<{
        userId: string;
        playerProfileId: string;
    }>;
    login(data: LoginDto): Promise<AuthResponse>;
    getUserById(userId: string): Promise<User | null>;
    updateProfile(userId: string, data: {
        name?: string;
        phone?: string;
        avatarUrl?: string | null;
    }): Promise<User>;
    getAllUsers(): Promise<Array<{
        id: string;
        name: string;
        clubCardNumber: string;
        phone: string;
        role: string;
        managedClubId: string | null;
        managedClub: {
            id: string;
            name: string;
        } | null;
    }>>;
    assignControllerToClub(controllerUserId: string, clubId: string): Promise<{
        managedClubId: string;
    }>;
    promoteToController(adminUserId: string, targetUserId: string, clubId: string): Promise<AuthResponse | null>;
    promoteToAdmin(userId: string): Promise<AuthResponse | null>;
}
//# sourceMappingURL=AuthService.d.ts.map