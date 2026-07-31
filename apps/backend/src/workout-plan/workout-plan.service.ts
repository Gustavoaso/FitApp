import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiServiceService } from '../ai-service/ai-service.service';

interface ExerciseData {
  name: string;
  sets: number;
  reps: string;
  rest?: string;
}

interface PlanData {
  name: string;
  description: string;
  exercises?: ExerciseData[];
}

@Injectable()
export class WorkoutPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiServiceService,
  ) {}

  async generate(userId: string) {
    const response = await this.aiService.generatePlan(userId, 'workout');
    const planData = (response.data || {}) as PlanData;
    const exercises = planData.exercises || [];
    return this.prisma.workoutPlan.create({
      data: {
        user_id: userId,
        name: planData.name || 'Treino Gerado por IA',
        description: planData.description || 'Plano de treino personalizado',
        exercises: {
          create: exercises.map((e) => ({
            user_id: userId,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            rest: e.rest,
          })),
        },
      },
      include: { exercises: true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.workoutPlan.findMany({
      where: { user_id: userId },
      include: { exercises: true },
    });
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

  async customize(userId: string, id: string, prompt?: string) {
    return this.aiService.customizePlan(
      userId,
      id,
      'workout',
      prompt || 'Personalizar treino',
    );
  }
}
