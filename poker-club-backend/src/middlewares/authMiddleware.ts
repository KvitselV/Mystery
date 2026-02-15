import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/JwtService';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    managedClubId?: string | null;
  };
}

const jwtService = new JwtService();
const userRepository = AppDataSource.getRepository(User);

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwtService.verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };
    if (payload.role === 'CONTROLLER') {
      const u = await userRepository.findOne({ where: { id: payload.userId }, select: ['managedClubId'] });
      req.user.managedClubId = u?.managedClubId ?? null;
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    next();
  };
};

/** ADMIN — полный доступ. CONTROLLER — доступ только к своему клубу (managedClubId обязателен) */
export const requireAdminOrController = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === 'ADMIN') return next();
    if (req.user.role === 'CONTROLLER') {
      if (!req.user.managedClubId) return res.status(403).json({ error: 'Controller must be assigned to a club' });
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: admin or controller required' });
  };
};

/** Только ADMIN — управление клубами и глобальные настройки */
export const requireAdmin = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden: admin required' });
    next();
  };
};
