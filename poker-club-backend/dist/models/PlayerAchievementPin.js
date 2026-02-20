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
exports.PlayerAchievementPin = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const AchievementType_1 = require("./AchievementType");
let PlayerAchievementPin = class PlayerAchievementPin {
};
exports.PlayerAchievementPin = PlayerAchievementPin;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlayerAchievementPin.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PlayerAchievementPin.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PlayerAchievementPin.prototype, "achievementTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PlayerAchievementPin.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", User_1.User)
], PlayerAchievementPin.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AchievementType_1.AchievementType, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'achievementTypeId' }),
    __metadata("design:type", AchievementType_1.AchievementType)
], PlayerAchievementPin.prototype, "achievementType", void 0);
exports.PlayerAchievementPin = PlayerAchievementPin = __decorate([
    (0, typeorm_1.Entity)('player_achievement_pins'),
    (0, typeorm_1.Index)(['userId', 'achievementTypeId'], { unique: true })
], PlayerAchievementPin);
//# sourceMappingURL=PlayerAchievementPin.js.map