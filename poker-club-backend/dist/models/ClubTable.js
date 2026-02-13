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
exports.ClubTable = void 0;
const typeorm_1 = require("typeorm");
const Club_1 = require("./Club");
let ClubTable = class ClubTable {
};
exports.ClubTable = ClubTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ClubTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Club_1.Club, (club) => club.tables, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'club_id' }),
    __metadata("design:type", Club_1.Club)
], ClubTable.prototype, "club", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ClubTable.prototype, "tableNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 9 }),
    __metadata("design:type", Number)
], ClubTable.prototype, "maxSeats", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'AVAILABLE' }),
    __metadata("design:type", String)
], ClubTable.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ClubTable.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ClubTable.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ClubTable.prototype, "updatedAt", void 0);
exports.ClubTable = ClubTable = __decorate([
    (0, typeorm_1.Entity)('club_tables')
], ClubTable);
//# sourceMappingURL=ClubTable.js.map