"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pokerStatisticsService = exports.POKER_METRIC_NAMES = exports.PokerStatisticsService = exports.UniversalStatisticsService = void 0;
__exportStar(require("./types"), exports);
var UniversalStatisticsService_1 = require("./UniversalStatisticsService");
Object.defineProperty(exports, "UniversalStatisticsService", { enumerable: true, get: function () { return UniversalStatisticsService_1.UniversalStatisticsService; } });
__exportStar(require("./calculators/BaseCalculators"), exports);
const PokerStatisticsService_1 = require("./PokerStatisticsService");
var PokerStatisticsService_2 = require("./PokerStatisticsService");
Object.defineProperty(exports, "PokerStatisticsService", { enumerable: true, get: function () { return PokerStatisticsService_2.PokerStatisticsService; } });
Object.defineProperty(exports, "POKER_METRIC_NAMES", { enumerable: true, get: function () { return PokerStatisticsService_2.POKER_METRIC_NAMES; } });
/** Единственный экземпляр PokerStatisticsService (singleton) */
exports.pokerStatisticsService = PokerStatisticsService_1.PokerStatisticsService.getInstance();
//# sourceMappingURL=index.js.map