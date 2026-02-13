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
exports.LeaderboardEntry = void 0;
const typeorm_1 = require("typeorm");
const Leaderboard_1 = require("./Leaderboard");
const PlayerProfile_1 = require("./PlayerProfile");
let LeaderboardEntry = class LeaderboardEntry {
};
exports.LeaderboardEntry = LeaderboardEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LeaderboardEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Leaderboard_1.Leaderboard, (leaderboard) => leaderboard.entries, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'leaderboardId' }),
    __metadata("design:type", Leaderboard_1.Leaderboard)
], LeaderboardEntry.prototype, "leaderboard", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PlayerProfile_1.PlayerProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'playerProfileId' }),
    __metadata("design:type", PlayerProfile_1.PlayerProfile)
], LeaderboardEntry.prototype, "playerProfile", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LeaderboardEntry.prototype, "rankPosition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LeaderboardEntry.prototype, "tournamentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LeaderboardEntry.prototype, "averageFinish", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LeaderboardEntry.prototype, "ratingPoints", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LeaderboardEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LeaderboardEntry.prototype, "updatedAt", void 0);
exports.LeaderboardEntry = LeaderboardEntry = __decorate([
    (0, typeorm_1.Entity)('leaderboard_entries')
], LeaderboardEntry);
//# sourceMappingURL=LeaderboardEntry.js.map