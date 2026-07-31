import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserProfileModule } from './user-profile/user-profile.module';
import { PrismaModule } from './prisma/prisma.module';
import { DietPlanModule } from './diet-plan/diet-plan.module';
import { WorkoutPlanModule } from './workout-plan/workout-plan.module';
import { DailyTaskModule } from './daily-task/daily-task.module';
import { BillingModule } from './billing/billing.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    AuthModule,
    UserProfileModule,
    PrismaModule,
    DietPlanModule,
    WorkoutPlanModule,
    DailyTaskModule,
    BillingModule,
    CalendarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
