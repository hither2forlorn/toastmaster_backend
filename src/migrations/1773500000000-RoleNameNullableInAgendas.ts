import { MigrationInterface, QueryRunner } from 'typeorm';

export class RoleNameNullableInAgendas1773500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agendas" ALTER COLUMN "role_name" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Set a placeholder for any rows that have no role before restoring NOT NULL
    await queryRunner.query(
      `UPDATE "agendas" SET "role_name" = 'Unassigned' WHERE "role_name" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "agendas" ALTER COLUMN "role_name" SET NOT NULL`,
    );
  }
}
