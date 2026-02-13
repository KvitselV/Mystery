import { Order, OrderStatus, OrderPaymentMethod } from '../models/Order';
export declare class OrderService {
    private orderRepo;
    private orderItemRepo;
    private menuItemRepo;
    private balanceRepo;
    private profileRepo;
    /**
     * Создать новый заказ (создание заказа и списание баланса в одной транзакции)
     */
    createOrder(data: {
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
    }): Promise<Order>;
    /**
     * Получить заказ по ID
     */
    getOrderById(id: string): Promise<Order>;
    /**
     * Получить заказы пользователя
     */
    getUserOrders(userId: string): Promise<Order[]>;
    /**
     * Получить заказы турнира
     */
    getTournamentOrders(tournamentId: string): Promise<Order[]>;
    /**
     * Получить все заказы с фильтрацией
     */
    getAllOrders(filters?: {
        status?: OrderStatus;
        tournamentId?: string;
        userId?: string;
        limit?: number;
    }): Promise<Order[]>;
    /**
     * Обновить статус заказа
     */
    updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
    /**
     * Отменить заказ (возврат на баланс и смена статуса в одной транзакции)
     */
    cancelOrder(id: string): Promise<Order>;
    /**
     * Получить статистику заказов
     */
    getOrderStatistics(filters?: {
        tournamentId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        totalOrders: number;
        totalRevenue: number;
        averageOrderAmount: number;
        ordersByStatus: {
            status: string;
            count: number;
        }[];
        topItems: Array<{
            name: string;
            quantity: number;
            revenue: number;
        }>;
    }>;
}
//# sourceMappingURL=OrderService.d.ts.map