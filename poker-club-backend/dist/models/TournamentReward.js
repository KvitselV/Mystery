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
exports.TournamentReward = void 0;
const typeorm_1 = require("typeorm");
const Tournament_1 = require("./Tournament");
const Reward_1 = require("./Reward");
let TournamentReward = class TournamentReward {
};
exports.TournamentReward = TournamentReward;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TournamentReward.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Tournament_1.Tournament, (t) => t.rewards, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tournament_id' }),
    __metadata("design:type", Tournament_1.Tournament)
], TournamentReward.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Reward_1.Reward, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'reward_id' }),
    __metadata("design:type", Reward_1.Reward)
], TournamentReward.prototype, "reward", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentReward.prototype, "place", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TournamentReward.prototype, "createdAt", void 0);
exports.TournamentReward = TournamentReward = __decorate([
    (0, typeorm_1.Entity)('tournament_rewards')
], TournamentReward);
//# sourceMappingURL=TournamentReward.js.map