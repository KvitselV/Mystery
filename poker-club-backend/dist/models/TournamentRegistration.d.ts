import { Tournament } from './Tournament';
import { PlayerProfile } from './PlayerProfile';
export declare class TournamentRegistration {
    id: string;
    tournament: Tournament;
    player: PlayerProfile;
    registeredAt: Date;
    paymentMethod: string;
    isActive: boolean;
    /** Игрок прибыл в клуб (отмечено управляющим). Самостоятельная регистрация = false, пока не нажали "Прибыл". */
    isArrived: boolean;
    currentStack: number;
}
//# sourceMappingURL=TournamentRegistration.d.ts.map