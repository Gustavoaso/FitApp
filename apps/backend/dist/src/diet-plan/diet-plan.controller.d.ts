import { DietPlanService } from './diet-plan.service';
export declare class DietPlanController {
    private readonly dietPlanService;
    constructor(dietPlanService: DietPlanService);
    generate(userId: string): Promise<{
        meals: {
            name: string;
            id: string;
            user_id: string;
            createdAt: Date;
            updatedAt: Date;
            time: string;
            foods: string;
            calories: number;
            macros: string | null;
            diet_plan_id: string;
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
        meals: {
            name: string;
            id: string;
            user_id: string;
            createdAt: Date;
            updatedAt: Date;
            time: string;
            foods: string;
            calories: number;
            macros: string | null;
            diet_plan_id: string;
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
        meals: {
            name: string;
            id: string;
            user_id: string;
            createdAt: Date;
            updatedAt: Date;
            time: string;
            foods: string;
            calories: number;
            macros: string | null;
            diet_plan_id: string;
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
    customize(userId: string, id: string): Promise<Record<string, unknown>>;
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
