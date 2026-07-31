import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as express from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

interface SessionData {
  user_id?: string;
  save: () => Promise<void>;
  destroy: () => void;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário via email e senha' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário e iniciar sessão' })
  async login(@Body() loginDto: LoginDto, @Req() req: express.Request) {
    const user = await this.authService.login(loginDto);

    if (user && user.id) {
      const sessionReq = req as express.Request & { session: SessionData };
      sessionReq.session.user_id = user.id;
      await sessionReq.session.save();
    }

    return { message: 'Logged in successfully', userId: user?.id };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Encerrar sessão' })
  logout(@Req() req: express.Request, @Res() res: express.Response) {
    const sessionReq = req as express.Request & { session: SessionData };
    if (sessionReq.session && sessionReq.session.destroy) {
      sessionReq.session.destroy();
    }
    return res
      .status(HttpStatus.OK)
      .json({ message: 'Logged out successfully' });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obter dados da sessão atual' })
  getMe(@UserId() userId: string) {
    return { userId };
  }
}
