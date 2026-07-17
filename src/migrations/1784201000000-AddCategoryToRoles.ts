import { MigrationInterface, QueryRunner } from "typeorm";

// Agenda roles to seed into the roles table. `key` is the stable identifier
// (aligned with the frontend SystemRole / backend AGENDA_ROLE enums) and `type`
// is the human-readable display name used across the app.
const AGENDA_ROLES: { key: string; name: string }[] = [
  { key: "PRESIDENT", name: "President" },
  { key: "VICE_PRESIDENT_EDUCATION", name: "VP Education" },
  { key: "VICE_PRESIDENT_MEMBERSHIP", name: "VP Membership" },
  { key: "VICE_PRESIDENT_PUBLIC_RELATIONS", name: "VP Public Relations" },
  { key: "SECRETARY", name: "Secretary" },
  { key: "TREASURER", name: "Treasurer" },
  { key: "SERGEANT_AT_ARMS", name: "Sergeant at Arms" },
  { key: "TOASTMASTER", name: "Toastmaster of the Evening" },
  { key: "GENERAL_EVALUATOR", name: "General Evaluator" },
  { key: "TIMER", name: "Timer" },
  { key: "GRAMMARIAN", name: "Grammarian" },
  { key: "AH_COUNTER", name: "Ah Counter" },
  { key: "TABLE_TOPIC_MASTER", name: "Table Topics Master" },
  { key: "SPEAKER", name: "Speaker" },
  { key: "EVALUATOR", name: "Evaluator" },
  { key: "TOPIC_SPEAKER", name: "Topic Speaker" },
  { key: "INVOCATOR", name: "Invocator" },
  { key: "BALLOT_COUNTER", name: "Ballot Counter" },
  { key: "WARMUP_MASTER", name: "Warmup Master" },
  { key: "GUEST", name: "Guest" },
];

export class AddCategoryToRoles1784201000000
  implements MigrationInterface
{
  name = "AddCategoryToRoles1784201000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add the discriminator column.
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN "category" character varying NOT NULL DEFAULT 'CLUB_MEMBER'`,
    );

    // 2. Backfill the existing 12 club-officer rows as CLUB_MEMBER.
    await queryRunner.query(
      `UPDATE "roles" SET "category" = 'CLUB_MEMBER'`,
    );

    // 3. Seed the agenda roles (skip any that already exist by key).
    for (const role of AGENDA_ROLES) {
      await queryRunner.query(
         `INSERT INTO "roles" ("id", "created_at", "updated_at", "is_deleted", "type", "key", "is_admin", "category")
         SELECT uuid_generate_v4(), now(), now(), false, $1, $2, false, 'AGENDA'
         WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "key" = $2::varchar)`,
        [role.name, role.key],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove seeded agenda roles and the discriminator column.
    await queryRunner.query(
      `DELETE FROM "roles" WHERE "category" = 'AGENDA'`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "category"`);
  }
}
