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
exports.DailyTaskController = void 0;
const common_1 = require("@nestjs/common");
const daily_task_service_1 = require("./daily-task.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const swagger_1 = require("@nestjs/swagger");
let DailyTaskController = class DailyTaskController {
    dailyTaskService;
    constructor(dailyTaskService) {
        this.dailyTaskService = dailyTaskService;
    }
    findAll(userId, date) {
        return this.dailyTaskService.findAllByDate(userId, date);
    }
    complete(userId, id) {
        return this.dailyTaskService.markAsComplete(userId, id);
    }
    uncomplete(userId, id) {
        return this.dailyTaskService.markAsUncomplete(userId, id);
    }
    generate() {
        return this.dailyTaskService.generateDailyTasks();
    }
};
exports.DailyTaskController = DailyTaskController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar tarefas de um dia específico' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, example: '2026-07-31' }),
    __param(0, (0, user_decorator_1.UserId)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DailyTaskController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar tarefa como concluída' }),
    __param(0, (0, user_decorator_1.UserId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DailyTaskController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/uncomplete'),
    (0, swagger_1.ApiOperation)({ summary: 'Desmarcar tarefa' }),
    __param(0, (0, user_decorator_1.UserId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DailyTaskController.prototype, "uncomplete", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar tarefas do dia via planos ativos' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DailyTaskController.prototype, "generate", null);
exports.DailyTaskController = DailyTaskController = __decorate([
    (0, swagger_1.ApiTags)('Daily Tasks'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Controller)('daily-tasks'),
    __metadata("design:paramtypes", [daily_task_service_1.DailyTaskService])
], DailyTaskController);
//# sourceMappingURL=daily-task.controller.js.map