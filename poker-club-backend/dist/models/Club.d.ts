import { ClubTable } from './ClubTable';
import { ClubSchedule } from './ClubSchedule';
import { Tournament } from './Tournament';
export declare class Club {
    id: string;
    name: string;
    description: string;
    address: string;
    phone: string;
    tableCount: number;
    isActive: boolean;
    tables: ClubTable[];
    schedules: ClubSchedule[];
    tournaments: Tournament[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Club.d.ts.map