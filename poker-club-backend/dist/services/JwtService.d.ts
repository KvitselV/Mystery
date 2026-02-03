import { JwtPayload } from '../types';
export declare class JwtService {
    private accessTokenSecret;
    private refreshTokenSecret;
    generateAccessToken(userId: string, role: string): string;
    generateRefreshToken(userId: string): string;
    verifyAccessToken(token: string): JwtPayload;
    verifyRefreshToken(token: string): {
        userId: string;
    };
}
//# sourceMappingURL=JwtService.d.ts.map