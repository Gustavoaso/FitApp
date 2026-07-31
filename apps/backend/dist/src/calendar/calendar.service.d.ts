import { PrismaService } from '../prisma/prisma.service';
export declare class CalendarService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    syncWithNativeCalendar(userId: string): Promise<{
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
