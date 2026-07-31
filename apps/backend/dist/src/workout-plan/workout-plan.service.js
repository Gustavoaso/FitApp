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
exports.WorkoutPlanService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkoutPlanService = class WorkoutPlanService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generate(userId) {
        return this.prisma.workoutPlan.create({
            data: {
                user_id: userId,
                name: 'Treino Gerado por IA (Mock)',
                description: 'Mock para integração futura',
            },
        });
    }
    async findAll(userId) {
        return this.prisma.workoutPlan.findMany({ where: { user_id: userId } });
    }
    async findOne(userId, id) {
        const plan = await this.prisma.workoutPlan.findUnique({
            where: { id, user_id: userId },
            include: { exercises: true },
        });
        if (!plan)
            throw new common_1.NotFoundException('Workout plan not found');
        return plan;
    }
    async update(userId, id, data) {
        return this.prisma.workoutPlan.update({
            where: { id, user_id: userId },
            data,
        });
    }
    async remove(userId, id) {
        return this.prisma.workoutPlan.update({
            where: { id, user_id: userId },
            data: { is_active: false },
        });
    }
    customize(userId, id) {
        return { message: 'Customization triggered', planId: id };
    }
};
exports.WorkoutPlanService = WorkoutPlanService;
exports.WorkoutPlanService = WorkoutPlanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkoutPlanService);
//# sourceMappingURL=workout-plan.service.js.map