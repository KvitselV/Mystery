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
exports.PlayerProfile = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let PlayerProfile = class PlayerProfile {
};
exports.PlayerProfile = PlayerProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlayerProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], PlayerProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PlayerProfile.prototype, "mmrValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2, default: 'E' }),
    __metadata("design:type", String)
], PlayerProfile.prototype, "rankCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PlayerProfile.prototype, "tournamentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], PlayerProfile.prototype, "winRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], PlayerProfile.prototype, "averageFinish", void 0);
exports.PlayerProfile = PlayerProfile = __decorate([
    (0, typeorm_1.Entity)('player_profiles')
], PlayerProfile);
//# sourceMappingURL=PlayerProfile.js.map