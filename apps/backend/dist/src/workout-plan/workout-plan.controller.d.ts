import { WorkoutPlanService } from './workout-plan.service';
export declare class WorkoutPlanController {
    private readonly workoutPlanService;
    constructor(workoutPlanService: WorkoutPlanService);
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
        exercises: {
            name: string;
            id: string;
            user_id: string;
            createdAt: Date;
            updatedAt: Date;
            workout_plan_id: string;
            sets: number;
            reps: string;
            rest: string | null;
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
    update(userId: string, id: string, data: any): Promise<{
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
    remove(userId: string, id: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        is_active: boolean;
    }>;
}
