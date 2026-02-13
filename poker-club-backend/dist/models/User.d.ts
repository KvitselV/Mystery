import { PlayerBalance } from './PlayerBalance';
export declare class User {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    passwordHash: string;
    role: 'ADMIN' | 'PLAYER' | 'WAITER' | 'TV';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    balance: PlayerBalance;
}
//# sourceMappingURL=User.d.ts.map