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
exports.AchievementInstance = void 0;
const typeorm_1 = require("typeorm");
const AchievementType_1 = require("./AchievementType");
const User_1 = require("./User");
const Tournament_1 = require("./Tournament");
let AchievementInstance = class AchievementInstance {
};
exports.AchievementInstance = AchievementInstance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AchievementInstance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], AchievementInstance.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], AchievementInstance.prototype, "achievementTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AchievementInstance.prototype, "tournamentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AchievementInstance.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AchievementInstance.prototype, "unlockedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", User_1.User)
], AchievementInstance.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AchievementType_1.AchievementType),
    (0, typeorm_1.JoinColumn)({ name: 'achievementTypeId' }),
    __metadata("design:type", AchievementType_1.AchievementType)
], AchievementInstance.prototype, "achievementType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Tournament_1.Tournament, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'tournamentId' }),
    __metadata("design:type", Tournament_1.Tournament)
], AchievementInstance.prototype, "tournament", void 0);
exports.AchievementInstance = AchievementInstance = __decorate([
    (0, typeorm_1.Entity)('achievement_instances'),
    (0, typeorm_1.Index)(['userId', 'achievementTypeId'], { unique: true })
], AchievementInstance);
//# sourceMappingURL=AchievementInstance.js.map