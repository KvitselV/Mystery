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
exports.TournamentSeries = void 0;
const typeorm_1 = require("typeorm");
const Tournament_1 = require("./Tournament");
const Club_1 = require("./Club");
let TournamentSeries = class TournamentSeries {
};
exports.TournamentSeries = TournamentSeries;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TournamentSeries.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], TournamentSeries.prototype, "idSeries", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TournamentSeries.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], TournamentSeries.prototype, "periodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], TournamentSeries.prototype, "periodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: '1,2,3,4,5,6' }),
    __metadata("design:type", String)
], TournamentSeries.prototype, "daysOfWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], TournamentSeries.prototype, "clubId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Club_1.Club, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'club_id' }),
    __metadata("design:type", Object)
], TournamentSeries.prototype, "club", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Tournament_1.Tournament, (tournament) => tournament.series),
    __metadata("design:type", Array)
], TournamentSeries.prototype, "tournaments", void 0);
exports.TournamentSeries = TournamentSeries = __decorate([
    (0, typeorm_1.Entity)('tournament_series')
], TournamentSeries);
//# sourceMappingURL=TournamentSeries.js.map