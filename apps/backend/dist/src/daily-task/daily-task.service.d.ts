import { PrismaService } from '../prisma/prisma.service';
export declare class DailyTaskService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllByDate(userId: string, date: string): Promise<{
        description: string | null;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        type: string;
        is_done: boolean;
        date: Date;
    }[]>;
    markAsComplete(userId: string, id: string): Promise<{
        description: string | null;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        type: string;
        is_done: boolean;
        date: Date;
    }>;
    markAsUncomplete(userId: string, id: string): Promise<{
        description: string | null;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        type: string;
        is_done: boolean;
        date: Date;
    }>;
    generateDailyTasks(): {
        message: string;
    };
}
