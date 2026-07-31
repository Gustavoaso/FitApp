import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DietPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(userId: string) {
    return this.prisma.dietPlan.create({
      data: {
        user_id: userId,
        name: 'Plano Gerado por IA (Mock)',
        description: 'Mock para integração futura',
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.dietPlan.findMany({ where: { user_id: userId } });
  }

  async findOne(userId: string, id: string) {
    const plan = await this.prisma.dietPlan.findUnique({
      where: { id, user_id: userId },
      include: { meals: true },
    });
    if (!plan) throw new NotFoundException('Diet plan not found');
    return plan;
  }

  async update(userId: string, id: string, data: Record<string, unknown>) {
    return this.prisma.dietPlan.update({
      where: { id, user_id: userId },
      data,
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.dietPlan.update({
      where: { id, user_id: userId },
      data: { is_active: false },
    });
  }

  customize(userId: string, id: string) {
    return { message: 'Customization triggered', planId: id };
  }
}
