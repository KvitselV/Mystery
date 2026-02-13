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
exports.Leaderboard = void 0;
const typeorm_1 = require("typeorm");
const LeaderboardEntry_1 = require("./LeaderboardEntry");
let Leaderboard = class Leaderboard {
};
exports.Leaderboard = Leaderboard;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Leaderboard.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Leaderboard.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['TOURNAMENT_SERIES', 'SEASONAL', 'RANK_MMR'],
    }),
    __metadata("design:type", String)
], Leaderboard.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Leaderboard.prototype, "periodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Leaderboard.prototype, "periodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Leaderboard.prototype, "seriesId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => LeaderboardEntry_1.LeaderboardEntry, (entry) => entry.leaderboard),
    __metadata("design:type", Array)
], Leaderboard.prototype, "entries", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Leaderboard.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Leaderboard.prototype, "updatedAt", void 0);
exports.Leaderboard = Leaderboard = __decorate([
    (0, typeorm_1.Entity)('leaderboards')
], Leaderboard);
//# sourceMappingURL=Leaderboard.js.map