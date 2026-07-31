"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DietPlanService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_service_service_1 = require("../ai-service/ai-service.service");
let DietPlanService = class DietPlanService {
    prisma;
    aiService;
    constructor(prisma, aiService) {
        this.prisma = prisma;
        this.aiService = aiService;
    }
    async generate(userId) {
        const response = await this.aiService.generatePlan(userId, 'diet');
        const planData = (response.data || {});
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
    async findAll(userId) {
        return this.prisma.dietPlan.findMany({
            where: { user_id: userId },
            include: { meals: true },
        });
    }
    async findOne(userId, id) {
        const plan = await this.prisma.dietPlan.findUnique({
            where: { id, user_id: userId },
            include: { meals: true },
        });
        if (!plan)
            throw new common_1.NotFoundException('Diet plan not found');
        return plan;
    }
    async update(userId, id, data) {
        return this.prisma.dietPlan.update({
            where: { id, user_id: userId },
            data,
        });
    }
    async remove(userId, id) {
        return this.prisma.dietPlan.update({
            where: { id, user_id: userId },
            data: { is_active: false },
        });
    }
    async customize(userId, id, prompt) {
        return this.aiService.customizePlan(userId, id, 'diet', prompt || 'Personalizar plano');
    }
};
exports.DietPlanService = DietPlanService;
exports.DietPlanService = DietPlanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_service_1.AiServiceService])
], DietPlanService);
//# sourceMappingURL=diet-plan.service.js.map