"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const PORT = parseInt(process.env.PORT || '3001', 10);
database_1.AppDataSource.initialize().then(async () => {
    console.log('✅ Database connected');
    // Запусти seeder только в development
    app_1.default.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
//# sourceMappingURL=server.js.map