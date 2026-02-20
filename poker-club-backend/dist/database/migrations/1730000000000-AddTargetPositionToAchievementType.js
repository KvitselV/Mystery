"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTargetPositionToAchievementType1730000000000 = void 0;
class AddTargetPositionToAchievementType1730000000000 {
    constructor() {
        this.name = 'AddTargetPositionToAchievementType1730000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "achievement_types"
      ADD COLUMN IF NOT EXISTS "targetPosition" integer
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "achievement_types" DROP COLUMN IF EXISTS "targetPosition"`);
    }
}
exports.AddTargetPositionToAchievementType1730000000000 = AddTargetPositionToAchievementType1730000000000;
//# sourceMappingURL=1730000000000-AddTargetPositionToAchievementType.js.map