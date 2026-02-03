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
exports.TableSeat = void 0;
const typeorm_1 = require("typeorm");
const TournamentTable_1 = require("./TournamentTable");
const PlayerProfile_1 = require("./PlayerProfile");
let TableSeat = class TableSeat {
};
exports.TableSeat = TableSeat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TableSeat.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TableSeat.prototype, "seatNumber", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TournamentTable_1.TournamentTable, (table) => table.seats, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'table_id' }),
    __metadata("design:type", TournamentTable_1.TournamentTable)
], TableSeat.prototype, "table", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PlayerProfile_1.PlayerProfile),
    (0, typeorm_1.JoinColumn)({ name: 'player_id' }),
    __metadata("design:type", PlayerProfile_1.PlayerProfile)
], TableSeat.prototype, "player", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], TableSeat.prototype, "isActive", void 0);
exports.TableSeat = TableSeat = __decorate([
    (0, typeorm_1.Entity)('table_seats')
], TableSeat);
//# sourceMappingURL=TableSeat.js.map