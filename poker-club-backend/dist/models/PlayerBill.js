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
exports.PlayerBill = exports.PlayerBillStatus = void 0;
const typeorm_1 = require("typeorm");
const PlayerProfile_1 = require("./PlayerProfile");
const Tournament_1 = require("./Tournament");
var PlayerBillStatus;
(function (PlayerBillStatus) {
    PlayerBillStatus["PENDING"] = "PENDING";
    PlayerBillStatus["PAID"] = "PAID";
})(PlayerBillStatus || (exports.PlayerBillStatus = PlayerBillStatus = {}));
/**
 * Счёт игроку после вылета: если он платил наличными (CASH), ему выставляется счёт
 * за вход (бай-ин), ребаи, аддоны и заказы в долг (CREDIT).
 */
let PlayerBill = class PlayerBill {
};
exports.PlayerBill = PlayerBill;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlayerBill.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PlayerProfile_1.PlayerProfile),
    (0, typeorm_1.JoinColumn)({ name: 'player_id' }),
    __metadata("design:type", PlayerProfile_1.PlayerProfile)
], PlayerBill.prototype, "playerProfile", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id' }),
    __metadata("design:type", String)
], PlayerBill.prototype, "playerProfileId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Tournament_1.Tournament),
    (0, typeorm_1.JoinColumn)({ name: 'tournament_id' }),
    __metadata("design:type", Tournament_1.Tournament)
], PlayerBill.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tournament_id' }),
    __metadata("design:type", String)
], PlayerBill.prototype, "tournamentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PlayerBill.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PlayerBill.prototype, "buyInAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PlayerBill.prototype, "rebuysAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PlayerBill.prototype, "addonsAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PlayerBill.prototype, "ordersAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PlayerBillStatus,
        default: PlayerBillStatus.PENDING,
    }),
    __metadata("design:type", String)
], PlayerBill.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PlayerBill.prototype, "createdAt", void 0);
exports.PlayerBill = PlayerBill = __decorate([
    (0, typeorm_1.Entity)('player_bills')
], PlayerBill);
//# sourceMappingURL=PlayerBill.js.map