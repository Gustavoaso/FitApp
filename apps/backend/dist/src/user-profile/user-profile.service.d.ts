import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UserProfileService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        email: string;
        name: string | null;
        goal: string | null;
        body_type: string | null;
        activity: string | null;
        diet_pref: string | null;
        schedule: string | null;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createProfile(userId: string, email: string): Promise<{
        email: string;
        name: string | null;
        goal: string | null;
        body_type: string | null;
        activity: string | null;
        diet_pref: string | null;
        schedule: string | null;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(userId: string, data: UpdateProfileDto): Promise<{
        email: string;
        name: string | null;
        goal: string | null;
        body_type: string | null;
        activity: string | null;
        diet_pref: string | null;
        schedule: string | null;
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
