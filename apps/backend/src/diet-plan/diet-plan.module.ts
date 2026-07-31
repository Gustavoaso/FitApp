import { Module } from '@nestjs/common';
import { DietPlanController } from './diet-plan.controller';
import { DietPlanService } from './diet-plan.service';
import { AiServiceModule } from '../ai-service/ai-service.module';

@Module({
  imports: [AiServiceModule],
  controllers: [DietPlanController],
  providers: [DietPlanService],
  exports: [DietPlanService],
})
export class DietPlanModule {}
