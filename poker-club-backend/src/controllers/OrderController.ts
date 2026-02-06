import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { OrderStatus } from '../models/Order';

const orderService = new OrderService();

export class OrderController {
  /**
   * POST /orders
   * Создать новый заказ
   */
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      // Пробуем получить userId из middleware (если есть)
      let userId = (req as any).user?.id;

      // Если нет middleware, берём из body
      if (!userId) {
        userId = req.body.userId;
      }

      if (!userId) {
        res.status(400).json({ 
          error: 'userId is required in request body' 
        });
        return;
      }

      const { tournamentId, items, notes, tableNumber } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Items array is required' });
        return;
      }

      const order = await orderService.createOrder({
        userId,
        tournamentId,
        items,
        notes,
        tableNumber,
      });

      res.status(201).json(order);
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(500).json({
        error: 'Failed to create order',
        details: error.message,
      });
    }
  }

  /**
   * GET /orders/my
   * Получить мои заказы
   */
  static async getMyOrders(req: Request, res: Response): Promise<void> {
    try {
      // Пробуем получить userId из middleware или query
      let userId = (req as any).user?.id || (req.query.userId as string);

      if (!userId) {
        res.status(400).json({ 
          error: 'userId is required as query parameter' 
        });
        return;
      }

      const orders = await orderService.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  /**
   * GET /orders/:id
   * Получить заказ по ID
   */
  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const order = await orderService.getOrderById(id);
      res.json(order);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      res.status(404).json({
        error: 'Order not found',
        details: error.message,
      });
    }
  }

  /**
   * GET /orders
   * Получить все заказы с фильтрами (admin)
   */
  static async getAllOrders(req: Request, res: Response): Promise<void> {
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
   * GET /orders/tournament/:tournamentId
   * Получить заказы турнира (admin)
   */
  static async getTournamentOrders(
    req: Request,
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
   * PATCH /orders/:id/status
   * Обновить статус заказа (admin)
   */
  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!status || !Object.values(OrderStatus).includes(status)) {
        res.status(400).json({ error: 'Valid status is required' });
        return;
      }

      const order = await orderService.updateOrderStatus(id, status);
      res.json(order);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        error: 'Failed to update order status',
        details: error.message,
      });
    }
  }

  /**
   * POST /orders/:id/cancel
   * Отменить заказ
   */
  static async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const order = await orderService.cancelOrder(id);
      res.json(order);
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      res.status(500).json({
        error: 'Failed to cancel order',
        details: error.message,
      });
    }
  }

  /**
   * GET /orders/statistics
   * Получить статистику заказов (admin)
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
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
