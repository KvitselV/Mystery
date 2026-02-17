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
exports.TournamentAdminReport = void 0;
const typeorm_1 = require("typeorm");
const Tournament_1 = require("./Tournament");
/**
 * Отчёт для администратора по завершённому турниру.
 * Можно заполнять/редактировать позже.
 */
let TournamentAdminReport = class TournamentAdminReport {
};
exports.TournamentAdminReport = TournamentAdminReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TournamentAdminReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Tournament_1.Tournament, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tournament_id' }),
    __metadata("design:type", Tournament_1.Tournament)
], TournamentAdminReport.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tournament_id', unique: true }),
    __metadata("design:type", String)
], TournamentAdminReport.prototype, "tournamentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentAdminReport.prototype, "attendanceCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentAdminReport.prototype, "cashRevenue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentAdminReport.prototype, "nonCashRevenue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], TournamentAdminReport.prototype, "expenses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentAdminReport.prototype, "totalProfit", void 0);
exports.TournamentAdminReport = TournamentAdminReport = __decorate([
    (0, typeorm_1.Entity)('tournament_admin_reports')
], TournamentAdminReport);
//# sourceMappingURL=TournamentAdminReport.js.map