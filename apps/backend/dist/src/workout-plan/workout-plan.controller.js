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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutPlanController = void 0;
const common_1 = require("@nestjs/common");
const workout_plan_service_1 = require("./workout-plan.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const swagger_1 = require("@nestjs/swagger");
let WorkoutPlanController = class WorkoutPlanController {
    workoutPlanService;
    constructor(workoutPlanService) {
        this.workoutPlanService = workoutPlanService;
    }
    generate(userId) {
        return this.workoutPlanService.generate(userId);
    }
    findAll(userId) {
        return this.workoutPlanService.findAll(userId);
    }
    findOne(userId, id) {
        return this.workoutPlanService.findOne(userId, id);
    }
    update(userId, id, data) {
        return this.workoutPlanService.update(userId, id, data);
    }
    customize(userId, id) {
        return this.workoutPlanService.customize(userId, id);
    }
    remove(userId, id) {
        return this.workoutPlanService.remove(userId, id);
    }
};
exports.WorkoutPlanController = WorkoutPlanController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar plano de treino via IA' }),
    __param(0, (0, user_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkoutPlanController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar planos de treino' }),
    __param(0, (0, user_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkoutPlanController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalhes do plano' }),
    __param(0, (0, user_decorator_1.UserId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WorkoutPlanController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Editar plano de treino' }),
    __param(0, (0, user_decorator_1.UserId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], WorkoutPlanController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/customize'),
    (0, swagger_1.ApiOperation)({ summary: 'Customização via IA' }),
    __param(0, (0, user_decorator_1.UserId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WorkoutPlanController.prototype, "customize", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete' }),
    __param(0, (0, user_decorator_1.UserId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WorkoutPlanController.prototype, "remove", null);
exports.WorkoutPlanController = WorkoutPlanController = __decorate([
    (0, swagger_1.ApiTags)('Workout Plans'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Controller)('workout-plans'),
    __metadata("design:paramtypes", [workout_plan_service_1.WorkoutPlanService])
], WorkoutPlanController);
//# sourceMappingURL=workout-plan.controller.js.map