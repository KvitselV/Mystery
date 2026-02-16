import { PlayerBalance } from './PlayerBalance';
import { Club } from './Club';
export declare class User {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    passwordHash: string;
    role: 'ADMIN' | 'CONTROLLER' | 'PLAYER' | 'WAITER' | 'TV';
    managedClubId: string | null;
    managedClub: Club | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    balance: PlayerBalance;
}
//# sourceMappingURL=User.d.ts.map