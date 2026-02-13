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
exports.TournamentLevel = void 0;
const typeorm_1 = require("typeorm");
const BlindStructure_1 = require("./BlindStructure");
let TournamentLevel = class TournamentLevel {
};
exports.TournamentLevel = TournamentLevel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TournamentLevel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => BlindStructure_1.BlindStructure, (structure) => structure.levels, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'blind_structure_id' }),
    __metadata("design:type", BlindStructure_1.BlindStructure)
], TournamentLevel.prototype, "blindStructure", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentLevel.prototype, "levelNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentLevel.prototype, "smallBlind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentLevel.prototype, "bigBlind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentLevel.prototype, "ante", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentLevel.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TournamentLevel.prototype, "isBreak", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TournamentLevel.prototype, "breakName", void 0);
exports.TournamentLevel = TournamentLevel = __decorate([
    (0, typeorm_1.Entity)('tournament_levels')
], TournamentLevel);
//# sourceMappingURL=TournamentLevel.js.map