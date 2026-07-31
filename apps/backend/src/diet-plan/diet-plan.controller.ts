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
import { DietPlanService } from './diet-plan.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Diet Plans')
@UseGuards(AuthGuard)
@Controller('diet-plans')
export class DietPlanController {
  constructor(private readonly dietPlanService: DietPlanService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Gerar plano via IA' })
  generate(@UserId() userId: string) {
    return this.dietPlanService.generate(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar planos do usuário' })
  findAll(@UserId() userId: string) {
    return this.dietPlanService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um plano' })
  findOne(@UserId() userId: string, @Param('id') id: string) {
    return this.dietPlanService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edição manual do plano' })
  update(@UserId() userId: string, @Param('id') id: string, @Body() data: any) {
    return this.dietPlanService.update(userId, id, data);
  }

  @Post(':id/customize')
  @ApiOperation({ summary: 'Customização via IA' })
  customize(@UserId() userId: string, @Param('id') id: string) {
    return this.dietPlanService.customize(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete' })
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.dietPlanService.remove(userId, id);
  }
}
