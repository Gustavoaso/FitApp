import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkoutPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(userId: string) {
    return this.prisma.workoutPlan.create({
      data: {
        user_id: userId,
        name: 'Treino Gerado por IA (Mock)',
        description: 'Mock para integração futura',
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.workoutPlan.findMany({ where: { user_id: userId } });
  }

  async findOne(userId: string, id: string) {
    const plan = await this.prisma.workoutPlan.findUnique({
      where: { id, user_id: userId },
      include: { exercises: true },
    });
    if (!plan) throw new NotFoundException('Workout plan not found');
    return plan;
  }

  async update(userId: string, id: string, data: Record<string, unknown>) {
    return this.prisma.workoutPlan.update({
      where: { id, user_id: userId },
      data,
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.workoutPlan.update({
      where: { id, user_id: userId },
      data: { is_active: false },
    });
  }

  customize(userId: string, id: string) {
    return { message: 'Customization triggered', planId: id };
  }
}
