import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async syncWithNativeCalendar(userId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { user_id: userId },
    });
  }

  async getEvents(userId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { user_id: userId },
    });
  }
}
