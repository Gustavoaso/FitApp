import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyTaskService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByDate(userId: string, date: string) {
    const targetDate = new Date(date);
    return this.prisma.dailyTask.findMany({
      where: {
        user_id: userId,
        date: targetDate,
      },
    });
  }

  async markAsComplete(userId: string, id: string) {
    return this.prisma.dailyTask.update({
      where: { id, user_id: userId },
      data: { is_done: true },
    });
  }

  async markAsUncomplete(userId: string, id: string) {
    return this.prisma.dailyTask.update({
      where: { id, user_id: userId },
      data: { is_done: false },
    });
  }

  generateDailyTasks() {
    return { message: 'Tasks generated for today' };
  }
}
