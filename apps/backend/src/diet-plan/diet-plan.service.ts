import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiServiceService } from '../ai-service/ai-service.service';

interface MealData {
  name: string;
  time: string;
  foods: string;
  calories: number;
  macros?: string;
}

interface PlanData {
  name: string;
  description: string;
  meals?: MealData[];
}

@Injectable()
export class DietPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiServiceService,
  ) {}

  async generate(userId: string) {
    const response = await this.aiService.generatePlan(userId, 'diet');
    const planData = (response.data || {}) as PlanData;
    const meals = planData.meals || [];
    return this.prisma.dietPlan.create({
      data: {
        user_id: userId,
        name: planData.name || 'Plano Gerado por IA',
        description: planData.description || 'Plano alimentador personalizado',
        meals: {
          create: meals.map((m) => ({
            user_id: userId,
            name: m.name,
            time: m.time,
            foods: m.foods,
            calories: m.calories,
            macros: m.macros,
          })),
        },
      },
      include: { meals: true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.dietPlan.findMany({
      where: { user_id: userId },
      include: { meals: true },
    });
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

  async customize(userId: string, id: string, prompt?: string) {
    return this.aiService.customizePlan(
      userId,
      id,
      'diet',
      prompt || 'Personalizar plano',
    );
  }
}
