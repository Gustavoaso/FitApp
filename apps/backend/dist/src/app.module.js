"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const user_profile_module_1 = require("./user-profile/user-profile.module");
const prisma_module_1 = require("./prisma/prisma.module");
const diet_plan_module_1 = require("./diet-plan/diet-plan.module");
const workout_plan_module_1 = require("./workout-plan/workout-plan.module");
const daily_task_module_1 = require("./daily-task/daily-task.module");
const billing_module_1 = require("./billing/billing.module");
const calendar_module_1 = require("./calendar/calendar.module");
const ai_service_module_1 = require("./ai-service/ai-service.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            user_profile_module_1.UserProfileModule,
            prisma_module_1.PrismaModule,
            diet_plan_module_1.DietPlanModule,
            workout_plan_module_1.WorkoutPlanModule,
            daily_task_module_1.DailyTaskModule,
            billing_module_1.BillingModule,
            calendar_module_1.CalendarModule,
            ai_service_module_1.AiServiceModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map