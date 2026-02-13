import { User } from './User';
import { Tournament } from './Tournament';
import { OrderItem } from './OrderItem';
export declare enum OrderStatus {
    PENDING = "PENDING",// Новый заказ
    PREPARING = "PREPARING",// Готовится
    READY = "READY",// Готов к выдаче
    DELIVERED = "DELIVERED",// Доставлен
    CANCELLED = "CANCELLED"
}
/** Оплата с депозита или в долг (счёт после вылета для CASH-игроков) */
export declare enum OrderPaymentMethod {
    DEPOSIT = "DEPOSIT",
    CREDIT = "CREDIT"
}
export declare class Order {
    id: string;
    user: User;
    userId: string;
    tournament?: Tournament;
    tournamentId?: string;
    status: OrderStatus;
    totalAmount: number;
    paymentMethod: OrderPaymentMethod;
    notes?: string;
    tableNumber?: number;
    items: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Order.d.ts.map