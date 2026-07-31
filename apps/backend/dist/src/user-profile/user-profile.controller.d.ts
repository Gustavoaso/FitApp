import { UserProfileService } from './user-profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UserProfileController {
    private readonly userProfileService;
    constructor(userProfileService: UserProfileService);
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
    updateProfile(userId: string, updateData: UpdateProfileDto): Promise<{
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
