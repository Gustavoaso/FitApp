import { DailyTaskService } from './daily-task.service';
export declare class DailyTaskController {
    private readonly dailyTaskService;
    constructor(dailyTaskService: DailyTaskService);
    findAll(userId: string, date: string): Promise<{
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
    complete(userId: string, id: string): Promise<{
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
    uncomplete(userId: string, id: string): Promise<{
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
    generate(): {
        message: string;
    };
}
