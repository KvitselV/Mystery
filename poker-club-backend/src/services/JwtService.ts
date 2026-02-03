import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export class JwtService {
  private accessTokenSecret = process.env.JWT_SECRET || 'your-secret-key';
  private refreshTokenSecret = process.env.JWT_SECRET + '_refresh' || 'refresh-secret-key';

  generateAccessToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      this.accessTokenSecret,
      { expiresIn: '7d' }
    );
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.refreshTokenSecret,
      { expiresIn: '30d' }
    );
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as { userId: string };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}
