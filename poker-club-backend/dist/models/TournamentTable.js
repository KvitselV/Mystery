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
exports.TournamentTable = void 0;
const typeorm_1 = require("typeorm");
const Tournament_1 = require("./Tournament");
const TableSeat_1 = require("./TableSeat");
const ClubTable_1 = require("./ClubTable");
let TournamentTable = class TournamentTable {
};
exports.TournamentTable = TournamentTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TournamentTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Tournament_1.Tournament, (tournament) => tournament.tables, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tournament_id' }),
    __metadata("design:type", Tournament_1.Tournament)
], TournamentTable.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], TournamentTable.prototype, "clubTableId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ClubTable_1.ClubTable, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'club_table_id' }),
    __metadata("design:type", Object)
], TournamentTable.prototype, "clubTable", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TournamentTable.prototype, "tableNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 9 }),
    __metadata("design:type", Number)
], TournamentTable.prototype, "maxSeats", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TournamentTable.prototype, "occupiedSeats", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'INACTIVE' }),
    __metadata("design:type", String)
], TournamentTable.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TableSeat_1.TableSeat, (seat) => seat.table, { cascade: true }),
    __metadata("design:type", Array)
], TournamentTable.prototype, "seats", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TournamentTable.prototype, "createdAt", void 0);
exports.TournamentTable = TournamentTable = __decorate([
    (0, typeorm_1.Entity)('tournament_tables')
], TournamentTable);
//# sourceMappingURL=TournamentTable.js.map