import { AppDataSource } from '../config/database';
import { Order, OrderStatus, OrderPaymentMethod } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { MenuItem } from '../models/MenuItem';
import { PlayerBalance } from '../models/PlayerBalance';
import { PlayerProfile } from '../models/PlayerProfile';

export class OrderService {
  private orderRepo = AppDataSource.getRepository(Order);
  private orderItemRepo = AppDataSource.getRepository(OrderItem);
  private menuItemRepo = AppDataSource.getRepository(MenuItem);
  private balanceRepo = AppDataSource.getRepository(PlayerBalance);
  private profileRepo = AppDataSource.getRepository(PlayerProfile);

  /**
   * Создать новый заказ (создание заказа и списание баланса в одной транзакции)
   */
  async createOrder(data: {
    userId: string;
    tournamentId?: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      notes?: string;
    }>;
    notes?: string;
    tableNumber?: number;
    paymentMethod?: OrderPaymentMethod;
  }): Promise<Order> {
    const paymentMethod = data.paymentMethod ?? OrderPaymentMethod.DEPOSIT;
    const isCredit = paymentMethod === OrderPaymentMethod.CREDIT;

    return AppDataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);
      const menuItemRepo = manager.getRepository(MenuItem);
      const balanceRepo = manager.getRepository(PlayerBalance);
      const profileRepo = manager.getRepository(PlayerProfile);

      const profile = await profileRepo.findOne({
        where: { user: { id: data.userId } },
        relations: ['user', 'balance'],
      });

      if (!profile) {
        throw new Error('User profile not found');
      }

      if (!isCredit && !profile.balance) {
        throw new Error('Balance not found (required for DEPOSIT payment)');
      }

      let totalAmount = 0;
      const orderItems: Array<{ menuItem: MenuItem; quantity: number; notes?: string }> = [];

      for (const itemData of data.items) {
        const menuItem = await menuItemRepo.findOne({
          where: { id: itemData.menuItemId },
        });

        if (!menuItem) {
          throw new Error(`Menu item ${itemData.menuItemId} not found`);
        }

        if (!menuItem.isAvailable) {
          throw new Error(`Menu item ${menuItem.name} is not available`);
        }

        if (itemData.quantity <= 0) {
          throw new Error('Quantity must be greater than 0');
        }

        totalAmount += menuItem.price * itemData.quantity;
        orderItems.push({
          menuItem,
          quantity: itemData.quantity,
          notes: itemData.notes,
        });
      }

      if (!isCredit && profile.balance && profile.balance.depositBalance < totalAmount) {
        throw new Error(
          `Insufficient balance. Required: ${totalAmount}, Available: ${profile.balance.depositBalance}`
        );
      }

      const order = orderRepo.create({
        userId: data.userId,
        tournamentId: data.tournamentId,
        status: OrderStatus.PENDING,
        totalAmount,
        paymentMethod,
        notes: data.notes,
        tableNumber: data.tableNumber,
      });

      const savedOrder = await orderRepo.save(order);

      for (const item of orderItems) {
        const orderItem = orderItemRepo.create({
          orderId: savedOrder.id,
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          priceAtOrder: item.menuItem.price,
          notes: item.notes,
        });
        await orderItemRepo.save(orderItem);
      }

      if (!isCredit && profile.balance) {
        profile.balance.depositBalance -= totalAmount;
        await balanceRepo.save(profile.balance);
      }

      const full = await orderRepo.findOne({
        where: { id: savedOrder.id },
        relations: ['user', 'tournament', 'items', 'items.menuItem'],
      });
      if (!full) throw new Error('Order not found after save');
      return full;
    });
  }

  /**
   * Получить заказ по ID
   */
  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['user', 'tournament', 'items', 'items.menuItem'],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  /**
   * Получить заказы пользователя
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: ['tournament', 'items', 'items.menuItem'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Получить заказы турнира
   */
  async getTournamentOrders(tournamentId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { tournamentId },
      relations: ['user', 'items', 'items.menuItem'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Получить все заказы с фильтрацией
   */
  async getAllOrders(filters?: {
    status?: OrderStatus;
    tournamentId?: string;
    userId?: string;
    limit?: number;
  }): Promise<Order[]> {
    const query = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.tournament', 'tournament')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .orderBy('order.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.tournamentId) {
      query.andWhere('order.tournamentId = :tournamentId', {
        tournamentId: filters.tournamentId,
      });
    }

    if (filters?.userId) {
      query.andWhere('order.userId = :userId', { userId: filters.userId });
    }

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    return query.getMany();
  }

  /**
   * Обновить статус заказа
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });

    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    await this.orderRepo.save(order);

    return this.getOrderById(id);
  }

  /**
   * Отменить заказ (возврат на баланс и смена статуса в одной транзакции)
   */
  async cancelOrder(id: string): Promise<Order> {
    return AppDataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const balanceRepo = manager.getRepository(PlayerBalance);
      const profileRepo = manager.getRepository(PlayerProfile);

      const order = await orderRepo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === OrderStatus.DELIVERED) {
        throw new Error('Cannot cancel delivered order');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new Error('Order is already cancelled');
      }

      const profile = await profileRepo.findOne({
        where: { user: { id: order.userId } },
        relations: ['balance'],
      });

      // Возврат на депозит только если заказ был оплачен с депозита (не в долг)
      const paidFromDeposit = order.paymentMethod !== OrderPaymentMethod.CREDIT;
      if (profile && profile.balance && paidFromDeposit) {
        profile.balance.depositBalance += order.totalAmount;
        await balanceRepo.save(profile.balance);
      }

      order.status = OrderStatus.CANCELLED;
      await orderRepo.save(order);

      const full = await orderRepo.findOne({
        where: { id },
        relations: ['user', 'tournament', 'items', 'items.menuItem'],
      });
      if (!full) throw new Error('Order not found after save');
      return full;
    });
  }

  /**
   * Получить статистику заказов
   */
  async getOrderStatistics(filters?: {
    tournamentId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderAmount: number;
    ordersByStatus: { status: string; count: number }[];
    topItems: Array<{ name: string; quantity: number; revenue: number }>;
  }> {
    const query = this.orderRepo.createQueryBuilder('order');

    if (filters?.tournamentId) {
      query.andWhere('order.tournamentId = :tournamentId', {
        tournamentId: filters.tournamentId,
      });
    }

    if (filters?.startDate) {
      query.andWhere('order.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('order.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const orders = await query.getMany();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderAmount = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Статистика по статусам
    const ordersByStatus = Object.values(OrderStatus).map((status) => ({
      status,
      count: orders.filter((o) => o.status === status).length,
    }));

    // Топ позиций
    const itemsQuery = this.orderItemRepo
      .createQueryBuilder('oi')
      .leftJoin('oi.order', 'order')
      .leftJoin('oi.menuItem', 'item')
      .select('item.name', 'name')
      .addSelect('SUM(oi.quantity)', 'quantity')
      .addSelect('SUM(oi.quantity * oi.priceAtOrder)', 'revenue')
      .groupBy('item.name')
      .orderBy('quantity', 'DESC')
      .limit(10);

    if (filters?.tournamentId) {
      itemsQuery.where('order.tournamentId = :tournamentId', {
        tournamentId: filters.tournamentId,
      });
    }

    const topItems = await itemsQuery.getRawMany();

    return {
      totalOrders,
      totalRevenue,
      averageOrderAmount: parseFloat(averageOrderAmount.toFixed(2)),
      ordersByStatus,
      topItems: topItems.map((item) => ({
        name: item.name,
        quantity: parseInt(item.quantity),
        revenue: parseInt(item.revenue),
      })),
    };
  }
}
