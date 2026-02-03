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
exports.Tournament = void 0;
const typeorm_1 = require("typeorm");
const TournamentSeries_1 = require("./TournamentSeries");
const TournamentTable_1 = require("./TournamentTable");
const TournamentRegistration_1 = require("./TournamentRegistration");
let Tournament = class Tournament {
};
exports.Tournament = Tournament;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Tournament.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Tournament.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Tournament.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['REG_OPEN', 'LATE_REG', 'RUNNING', 'FINISHED', 'ARCHIVED'], default: 'REG_OPEN' }),
    __metadata("design:type", String)
], Tournament.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Tournament.prototype, "buyInAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Tournament.prototype, "startingStack", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Tournament.prototype, "currentLevelNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Tournament.prototype, "blindStructureId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TournamentSeries_1.TournamentSeries, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'series_id' }),
    __metadata("design:type", TournamentSeries_1.TournamentSeries)
], Tournament.prototype, "series", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TournamentTable_1.TournamentTable, (table) => table.tournament),
    __metadata("design:type", Array)
], Tournament.prototype, "tables", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TournamentRegistration_1.TournamentRegistration, (reg) => reg.tournament),
    __metadata("design:type", Array)
], Tournament.prototype, "registrations", void 0);
exports.Tournament = Tournament = __decorate([
    (0, typeorm_1.Entity)('tournaments')
], Tournament);
//# sourceMappingURL=Tournament.js.map