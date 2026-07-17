import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleIdToAgendas1784202000000
  implements MigrationInterface
{
  name = "AddRoleIdToAgendas1784202000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add the nullable FK column.
    await queryRunner.query(`ALTER TABLE "agendas" ADD COLUMN "role_id" uuid`);

    // 2. Backfill existing agendas by matching role_name to the agenda role's
    //    display name (roles.type where category = 'AGENDA').
    await queryRunner.query(
      `UPDATE "agendas" a
       SET "role_id" = r."id"
       FROM "roles" r
       WHERE a."role_name" = r."type"
         AND r."category" = 'AGENDA'
         AND a."role_id" IS NULL`,
    );

    // 3. Foreign key constraint (kept nullable so free-text / legacy rows stay valid).
    await queryRunner.query(
      `ALTER TABLE "agendas" ADD CONSTRAINT "FK_agenda_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agendas" DROP CONSTRAINT "FK_agenda_role"`,
    );
    await queryRunner.query(`ALTER TABLE "agendas" DROP COLUMN "role_id"`);
  }
}
