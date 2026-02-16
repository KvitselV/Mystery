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
exports.PlayerOperation = void 0;
const typeorm_1 = require("typeorm");
const PlayerProfile_1 = require("./PlayerProfile");
const Tournament_1 = require("./Tournament");
let PlayerOperation = class PlayerOperation {
};
exports.PlayerOperation = PlayerOperation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlayerOperation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PlayerProfile_1.PlayerProfile),
    (0, typeorm_1.JoinColumn)({ name: 'player_id' }),
    __metadata("design:type", PlayerProfile_1.PlayerProfile)
], PlayerOperation.prototype, "playerProfile", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['DEPOSIT_TOPUP', 'DEPOSIT_WITHDRAWAL', 'BUYIN', 'REBUY', 'ADDON', 'ORDER_PAYMENT', 'REFUND'] }),
    __metadata("design:type", String)
], PlayerOperation.prototype, "operationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PlayerOperation.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Tournament_1.Tournament, { nullable: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tournament_id' }),
    __metadata("design:type", Tournament_1.Tournament)
], PlayerOperation.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PlayerOperation.prototype, "createdAt", void 0);
exports.PlayerOperation = PlayerOperation = __decorate([
    (0, typeorm_1.Entity)('player_operations')
], PlayerOperation);
//# sourceMappingURL=PlayerOperation.js.map