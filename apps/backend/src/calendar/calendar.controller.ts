import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Calendar')
@UseGuards(AuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sincronizar com calendário nativo' })
  sync(@UserId() userId: string) {
    return this.calendarService.syncWithNativeCalendar(userId);
  }

  @Get('events')
  @ApiOperation({ summary: 'Listar eventos do calendário do app' })
  getEvents(@UserId() userId: string) {
    return this.calendarService.getEvents(userId);
  }
}
