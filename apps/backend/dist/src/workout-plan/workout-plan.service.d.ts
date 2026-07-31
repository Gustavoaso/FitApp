import { PrismaService } from '../prisma/prisma.service';
import { AiServiceService } from '../ai-service/ai-service.service';
export declare class WorkoutPlanService {
    private readonly prisma;
    private readonly aiService;
    constructor(prisma: PrismaService, aiService: AiServiceService);
    generate(userId: string): Promise<{
        exercises: {
            name: string;
            id: string;
            user_id: string;
            createdAt: Date;
            updatedAt: Date;
            sets: number;
            reps: string;
            rest: string | null;
            workout_plan_id: string;
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
    findAll(userId: string): Promise<({
        exercises: {
            name: string;
            id: string;
            user_id: string;
            createdAt: Date;
            updatedAt: Date;
            sets: number;
            reps: string;
            rest: string | null;
            workout_plan_id: string;
        }[];
    } & {
        description: string | null;
        name: string;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        is_active: boolean;
    })[]>;
    findOne(userId: string, id: string): Promise<{
        exercises: {
            name: string;
            id: string;
            user_id: string;
            createdAt: Date;
            updatedAt: Date;
            sets: number;
            reps: string;
            rest: string | null;
            workout_plan_id: string;
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
    customize(userId: string, id: string, prompt?: string): Promise<Record<string, unknown>>;
}
