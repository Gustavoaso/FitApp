import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { WorkoutPlanService } from './workout-plan.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Workout Plans')
@UseGuards(AuthGuard)
@Controller('workout-plans')
export class WorkoutPlanController {
  constructor(private readonly workoutPlanService: WorkoutPlanService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Gerar plano de treino via IA' })
  generate(@UserId() userId: string) {
    return this.workoutPlanService.generate(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar planos de treino' })
  findAll(@UserId() userId: string) {
    return this.workoutPlanService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do plano' })
  findOne(@UserId() userId: string, @Param('id') id: string) {
    return this.workoutPlanService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar plano de treino' })
  update(@UserId() userId: string, @Param('id') id: string, @Body() data: any) {
    return this.workoutPlanService.update(userId, id, data);
  }

  @Post(':id/customize')
  @ApiOperation({ summary: 'Customização via IA' })
  customize(@UserId() userId: string, @Param('id') id: string) {
    return this.workoutPlanService.customize(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete' })
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.workoutPlanService.remove(userId, id);
  }
}
