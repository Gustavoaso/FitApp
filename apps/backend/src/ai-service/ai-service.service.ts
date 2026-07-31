import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class AiServiceService {
  private readonly aiServiceUrl =
    process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

  async generatePlan(
    userId: string,
    planType: 'diet' | 'workout' | 'both',
    details?: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.aiServiceUrl}/plans/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ plan_type: planType, details }),
      });
      if (!response.ok) {
        throw new Error(`AI Service returned status ${response.status}`);
      }
      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to call AI Service: ${(error as Error).message}`,
      );
    }
  }

  async customizePlan(
    userId: string,
    planId: string,
    planType: 'diet' | 'workout',
    prompt: string,
  ): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.aiServiceUrl}/plans/customize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ plan_id: planId, plan_type: planType, prompt }),
      });
      if (!response.ok) {
        throw new Error(`AI Service returned status ${response.status}`);
      }
      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to call AI Service: ${(error as Error).message}`,
      );
    }
  }
}
