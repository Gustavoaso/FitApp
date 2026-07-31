import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { session?: any }>();
    const session = request.session;

    if (!session || !session.user_id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return true;
  }
}
