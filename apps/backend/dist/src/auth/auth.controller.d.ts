import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as express from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<import("@supabase/supabase-js").AuthUser | null>;
    login(loginDto: LoginDto, req: express.Request): Promise<{
        message: string;
        userId: string;
    }>;
    logout(req: express.Request, res: express.Response): express.Response<any, Record<string, any>>;
    getMe(userId: string): {
        userId: string;
    };
}
