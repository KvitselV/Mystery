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
}
//# sourceMappingURL=AuthService.d.ts.map