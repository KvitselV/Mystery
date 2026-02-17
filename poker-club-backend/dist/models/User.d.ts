import { PlayerBalance } from './PlayerBalance';
import { Club } from './Club';
export declare class User {
    id: string;
    name: string;
    clubCardNumber: string;
    phone: string;
    passwordHash: string;
    role: 'ADMIN' | 'CONTROLLER' | 'PLAYER' | 'WAITER' | 'TV';
    managedClubId: string | null;
    managedClub: Club | null;
    isActive: boolean;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    balance: PlayerBalance;
}
//# sourceMappingURL=User.d.ts.map