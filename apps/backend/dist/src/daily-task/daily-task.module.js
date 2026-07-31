"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyTaskModule = void 0;
const common_1 = require("@nestjs/common");
const daily_task_controller_1 = require("./daily-task.controller");
const daily_task_service_1 = require("./daily-task.service");
let DailyTaskModule = class DailyTaskModule {
};
exports.DailyTaskModule = DailyTaskModule;
exports.DailyTaskModule = DailyTaskModule = __decorate([
    (0, common_1.Module)({
        controllers: [daily_task_controller_1.DailyTaskController],
        providers: [daily_task_service_1.DailyTaskService],
    })
], DailyTaskModule);
//# sourceMappingURL=daily-task.module.js.map