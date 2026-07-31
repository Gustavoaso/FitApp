import { Module } from '@nestjs/common';
import { DietPlanController } from './diet-plan.controller';
import { DietPlanService } from './diet-plan.service';

@Module({
  controllers: [DietPlanController],
  providers: [DietPlanService],
})
export class DietPlanModule {}
