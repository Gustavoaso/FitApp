import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DailyTaskService } from './daily-task.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Daily Tasks')
@UseGuards(AuthGuard)
@Controller('daily-tasks')
export class DailyTaskController {
  constructor(private readonly dailyTaskService: DailyTaskService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tarefas de um dia específico' })
  @ApiQuery({ name: 'date', required: true, example: '2026-07-31' })
  findAll(@UserId() userId: string, @Query('date') date: string) {
    return this.dailyTaskService.findAllByDate(userId, date);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Marcar tarefa como concluída' })
  complete(@UserId() userId: string, @Param('id') id: string) {
    return this.dailyTaskService.markAsComplete(userId, id);
  }

  @Patch(':id/uncomplete')
  @ApiOperation({ summary: 'Desmarcar tarefa' })
  uncomplete(@UserId() userId: string, @Param('id') id: string) {
    return this.dailyTaskService.markAsUncomplete(userId, id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Gerar tarefas do dia via planos ativos' })
  generate() {
    return this.dailyTaskService.generateDailyTasks();
  }
}
