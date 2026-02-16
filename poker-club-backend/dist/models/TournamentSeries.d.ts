import { Tournament } from './Tournament';
import { Club } from './Club';
export declare class TournamentSeries {
    id: string;
    idSeries?: string | null;
    name: string;
    periodStart: Date;
    periodEnd: Date;
    /** Дни недели: 0=Вс, 1=Пн, ..., 6=Сб. Хранится как "0,1,2,3,4,5,6" */
    daysOfWeek: string;
    clubId: string | null;
    club: Club | null;
    tournaments: Tournament[];
}
//# sourceMappingURL=TournamentSeries.d.ts.map