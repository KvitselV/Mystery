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
exports.AchievementType = exports.AchievementCode = void 0;
const typeorm_1 = require("typeorm");
const AchievementInstance_1 = require("./AchievementInstance");
var AchievementCode;
(function (AchievementCode) {
    AchievementCode["FIRST_TOURNAMENT"] = "FIRST_TOURNAMENT";
    AchievementCode["FIVE_TOURNAMENTS"] = "FIVE_TOURNAMENTS";
    AchievementCode["TEN_TOURNAMENTS"] = "TEN_TOURNAMENTS";
    AchievementCode["FINAL_TABLE"] = "FINAL_TABLE";
    AchievementCode["WIN"] = "WIN";
    AchievementCode["HOT_STREAK"] = "HOT_STREAK";
})(AchievementCode || (exports.AchievementCode = AchievementCode = {}));
let AchievementType = class AchievementType {
};
exports.AchievementType = AchievementType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AchievementType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AchievementCode,
        unique: true,
    }),
    __metadata("design:type", String)
], AchievementType.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], AchievementType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AchievementType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], AchievementType.prototype, "iconUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], AchievementType.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AchievementType.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AchievementInstance_1.AchievementInstance, (instance) => instance.achievementType),
    __metadata("design:type", Array)
], AchievementType.prototype, "instances", void 0);
exports.AchievementType = AchievementType = __decorate([
    (0, typeorm_1.Entity)('achievement_types')
], AchievementType);
//# sourceMappingURL=AchievementType.js.map