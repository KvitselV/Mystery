import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middlewares/authMiddleware';

const authService = new AuthService();

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { firstName, lastName, phone, email, password } = req.body;

      // Базовая валидация
      if (!firstName || !lastName || !phone || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await authService.register({
        firstName,
        lastName,
        phone,
        email,
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
}
