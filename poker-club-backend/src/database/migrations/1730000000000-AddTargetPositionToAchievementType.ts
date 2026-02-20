import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTargetPositionToAchievementType1730000000000 implements MigrationInterface {
  name = 'AddTargetPositionToAchievementType1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "achievement_types"
      ADD COLUMN IF NOT EXISTS "targetPosition" integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "achievement_types" DROP COLUMN IF EXISTS "targetPosition"`);
  }
}
