import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private supabase;
    constructor();
    register(registerDto: RegisterDto): Promise<import("@supabase/supabase-js").AuthUser | null>;
    login(loginDto: LoginDto): Promise<import("@supabase/supabase-js").AuthUser>;
}
