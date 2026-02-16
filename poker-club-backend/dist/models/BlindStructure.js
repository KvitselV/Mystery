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
exports.BlindStructure = void 0;
const typeorm_1 = require("typeorm");
const TournamentLevel_1 = require("./TournamentLevel");
const Club_1 = require("./Club");
let BlindStructure = class BlindStructure {
};
exports.BlindStructure = BlindStructure;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BlindStructure.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], BlindStructure.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], BlindStructure.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], BlindStructure.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], BlindStructure.prototype, "clubId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Club_1.Club, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'club_id' }),
    __metadata("design:type", Object)
], BlindStructure.prototype, "club", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TournamentLevel_1.TournamentLevel, (level) => level.blindStructure, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], BlindStructure.prototype, "levels", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BlindStructure.prototype, "createdAt", void 0);
exports.BlindStructure = BlindStructure = __decorate([
    (0, typeorm_1.Entity)('blind_structures')
], BlindStructure);
//# sourceMappingURL=BlindStructure.js.map