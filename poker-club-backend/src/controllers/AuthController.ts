import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middlewares/authMiddleware';

const authService = new AuthService();

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, clubCardNumber, phone, password } = req.body;

      if (!name || !clubCardNumber || !phone || !password) {
        return res.status(400).json({ error: 'Обязательные поля: имя, номер клубной карты, телефон, пароль' });
      }

      const result = await authService.register({
        name,
        clubCardNumber,
        phone,
        password,
      });

      (req.session as { userId?: string; role?: string }).userId = result.user.id;
      (req.session as { role?: string }).role = result.user.role;
      await new Promise<void>((res, rej) => req.session.save((err) => (err ? rej(err) : res())));

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

      (req.session as { userId?: string; role?: string; managedClubId?: string | null }).userId = result.user.id;
      (req.session as { role?: string }).role = result.user.role;
      (req.session as { managedClubId?: string | null }).managedClubId = result.user.managedClubId ?? null;
      await new Promise<void>((res, rej) => req.session.save((err) => (err ? rej(err) : res())));

      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ error: message });
    }
  }

  static async logout(req: Request, res: Response) {
    req.session.destroy(() => res.json({ ok: true }));
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
      (req.session as { role?: string }).role = 'ADMIN';
      await new Promise<void>((res, rej) => req.session.save((err) => (err ? rej(err) : res())));
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
