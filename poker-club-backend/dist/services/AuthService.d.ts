import { User } from '../models/User';
import { RegisterDto, LoginDto, AuthResponse } from '../types';
export declare class AuthService {
    private userRepository;
    private playerRepository;
    private balanceRepository;
    private jwtService;
    register(data: RegisterDto): Promise<AuthResponse>;
    login(data: LoginDto): Promise<AuthResponse>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    getUserById(userId: string): Promise<User | null>;
    getAllUsers(): Promise<Array<{
        id: string;
        firstName: string;
        lastName: string;
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