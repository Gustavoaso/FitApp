import { Module } from '@nestjs/common';
import { DailyTaskController } from './daily-task.controller';
import { DailyTaskService } from './daily-task.service';

@Module({
  controllers: [DailyTaskController],
  providers: [DailyTaskService],
})
export class DailyTaskModule {}
