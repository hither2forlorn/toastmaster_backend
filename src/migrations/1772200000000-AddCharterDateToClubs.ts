import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCharterDateToClubs1772200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "charter_date" date NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP COLUMN IF EXISTS "charter_date"`,
    );
  }
}
