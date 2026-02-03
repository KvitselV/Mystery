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
exports.TournamentRegistration = void 0;
const typeorm_1 = require("typeorm");
const Tournament_1 = require("./Tournament");
const PlayerProfile_1 = require("./PlayerProfile");
let TournamentRegistration = class TournamentRegistration {
};
exports.TournamentRegistration = TournamentRegistration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TournamentRegistration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Tournament_1.Tournament, (tournament) => tournament.registrations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tournament_id' }),
    __metadata("design:type", Tournament_1.Tournament)
], TournamentRegistration.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PlayerProfile_1.PlayerProfile),
    (0, typeorm_1.JoinColumn)({ name: 'player_id' }),
    __metadata("design:type", PlayerProfile_1.PlayerProfile)
], TournamentRegistration.prototype, "player", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], TournamentRegistration.prototype, "registeredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['CASH', 'DEPOSIT'], default: 'DEPOSIT' }),
    __metadata("design:type", String)
], TournamentRegistration.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TournamentRegistration.prototype, "isActive", void 0);
exports.TournamentRegistration = TournamentRegistration = __decorate([
    (0, typeorm_1.Entity)('tournament_registrations')
], TournamentRegistration);
//# sourceMappingURL=TournamentRegistration.js.map