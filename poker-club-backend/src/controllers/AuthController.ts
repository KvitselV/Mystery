import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middlewares/authMiddleware';

const authService = new AuthService();

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, clubCardNumber, phone, password } = req.body;

      // Базовая валидация
      if (!name || !clubCardNumber || !phone || !password) {
        return res.status(400).json({ error: 'Обязательные поля: имя, номер клубной карты, телефон, пароль' });
      }

      const result = await authService.register({
        name,
        clubCardNumber,
        phone,
        password,
      });

      res.status(201).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ error: message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({ error: 'Phone and password are required' });
      }

      const result = await authService.login({ phone, password });

      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ error: message });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid refresh token';
      res.status(401).json({ error: message });
    }
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await authService.getUserById(req.user.userId);

      res.json(user);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(400).json({ error: message });
    }
  }

  static async promoteToAdmin(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const result = await authService.promoteToAdmin(req.user.userId);
      if (!result) return res.status(403).json({ error: 'Promotion not allowed' });
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async assignControllerToClub(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
      const { userId, clubId } = req.body;
      if (!userId || !clubId) return res.status(400).json({ error: 'userId and clubId required' });
      const result = await authService.assignControllerToClub(userId, clubId);
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getUsers(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
      const users = await authService.getAllUsers();
      res.json({ users });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async promoteToController(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
      const { userId, clubId } = req.body;
      if (!userId || !clubId) return res.status(400).json({ error: 'userId and clubId required' });
      const result = await authService.promoteToController(req.user.userId, userId, clubId);
      if (!result) return res.status(400).json({ error: 'Promotion failed' });
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }
}
