import { PrismaService } from '../prisma/prisma.service';
export declare class DietPlanService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generate(userId: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        is_active: boolean;
    }>;
    findAll(userId: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        is_active: boolean;
    }[]>;
    findOne(userId: string, id: string): Promise<{
        meals: {
            name: string;
            id: string;
            user_id: string;
            createdAt: Date;
            updatedAt: Date;
            diet_plan_id: string;
            time: string;
            foods: string;
            calories: number;
            macros: string | null;
        }[];
    } & {
        description: string | null;
        name: string;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        is_active: boolean;
    }>;
    update(userId: string, id: string, data: Record<string, unknown>): Promise<{
        description: string | null;
        name: string;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        is_active: boolean;
    }>;
    remove(userId: string, id: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        is_active: boolean;
    }>;
    customize(userId: string, id: string): {
        message: string;
        planId: string;
    };
}
