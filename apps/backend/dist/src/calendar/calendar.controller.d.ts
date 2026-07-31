import { CalendarService } from './calendar.service';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    sync(userId: string): Promise<{
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        time: string | null;
        title: string;
        date: Date;
    }[]>;
    getEvents(userId: string): Promise<{
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        time: string | null;
        title: string;
        date: Date;
    }[]>;
}
