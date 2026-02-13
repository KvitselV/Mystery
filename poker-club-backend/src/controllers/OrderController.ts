import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { OrderService } from '../services/OrderService';
import { OrderStatus, OrderPaymentMethod } from '../models/Order';

const orderService = new OrderService();

export class OrderController {
  /**
   * POST /orders — создать заказ от имени текущего пользователя
   */
  static async createOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const userId = req.user.userId;
      const { tournamentId, items, notes, tableNumber, paymentMethod } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Items array is required' });
        return;
      }

      const method =
        paymentMethod === OrderPaymentMethod.CREDIT
          ? OrderPaymentMethod.CREDIT
          : OrderPaymentMethod.DEPOSIT;

      const order = await orderService.createOrder({
        userId,
        tournamentId,
        items,
        notes,
        tableNumber,
        paymentMethod: method,
      });

      res.status(201).json(order);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      res.status(400).json({ error: message });
    }
  }

  /**
   * GET /orders/my — заказы текущего пользователя
   */
  static async getMyOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const orders = await orderService.getUserOrders(req.user.userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  /**
   * GET /orders/:id — заказ по ID (только свой или admin)
   */
  static async getOrderById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const id = req.params.id as string;
      const order = await orderService.getOrderById(id);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      const isOwner = order.userId === req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      res.json(order);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Order not found';
      res.status(404).json({ error: message });
    }
  }

  /**
   * GET /orders — все заказы (admin)
   */
  static async getAllOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, tournamentId, userId, limit } = req.query;

      const orders = await orderService.getAllOrders({
        status: status as OrderStatus,
        tournamentId: tournamentId as string,
        userId: userId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  /**
   * GET /orders/tournament/:tournamentId — заказы турнира (admin)
   */
  static async getTournamentOrders(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const tournamentId = req.params.tournamentId as string;
      const orders = await orderService.getTournamentOrders(tournamentId);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching tournament orders:', error);
      res.status(500).json({ error: 'Failed to fetch tournament orders' });
    }
  }

  /**
   * PATCH /orders/:id/status — обновить статус заказа (admin)
   */
  static async updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!status || !Object.values(OrderStatus).includes(status)) {
        res.status(400).json({ error: 'Valid status is required' });
        return;
      }

      const order = await orderService.updateOrderStatus(id, status);
      res.json(order);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update order status';
      res.status(400).json({ error: message });
    }
  }

  /**
   * POST /orders/:id/cancel — отменить заказ (только свой или admin)
   */
  static async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const id = req.params.id as string;
      const order = await orderService.getOrderById(id);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      const isOwner = order.userId === req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const cancelled = await orderService.cancelOrder(id);
      res.json(cancelled);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel order';
      res.status(400).json({ error: message });
    }
  }

  /**
   * GET /orders/statistics — статистика заказов (admin)
   */
  static async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tournamentId, startDate, endDate } = req.query;

      const statistics = await orderService.getOrderStatistics({
        tournamentId: tournamentId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json(statistics);
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
}
