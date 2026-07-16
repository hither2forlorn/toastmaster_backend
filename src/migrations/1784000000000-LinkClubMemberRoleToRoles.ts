import { MigrationInterface, QueryRunner } from "typeorm";

// Roles to seed. `isAdmin` marks the titles that may add/remove members.
const ROLES: { key: string; name: string; isAdmin: boolean }[] = [
  { key: "IMMEDIATE_PAST_PRESIDENT", name: "Immediate Past President", isAdmin: false },
  { key: "PRESIDENT", name: "President", isAdmin: true },
  { key: "VP_EDUCATION", name: "VP Education", isAdmin: true },
  { key: "ASSOCIATE_VPE", name: "Associate - VPE", isAdmin: false },
  { key: "VP_MEMBERSHIP", name: "VP Membership", isAdmin: true },
  { key: "ASSOCIATE_VPM", name: "Associate - VPM", isAdmin: false },
  { key: "VP_PUBLIC_RELATIONS", name: "VP Public Relations", isAdmin: false },
  { key: "ASSOCIATE_VPPR", name: "Associate - VPPR", isAdmin: false },
  { key: "SECRETARY", name: "Secretary", isAdmin: false },
  { key: "TREASURER", name: "Treasurer", isAdmin: false },
  { key: "SERGEANT_AT_ARMS", name: "Sergeant at Arms", isAdmin: false },
  { key: "MEMBER", name: "Member", isAdmin: false },
];

export class LinkClubMemberRoleToRoles1784000000000
  implements MigrationInterface
{
  name = "LinkClubMemberRoleToRoles1784000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Clear any orphan placeholder rows from the previously-created
    //    (but unlinked) roles table, so the new unique "key" has no collisions.
    await queryRunner.query(`DELETE FROM "roles"`);

    // 2. Extend roles table with a stable key + admin flag.
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN "key" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN "is_admin" boolean NOT NULL DEFAULT false`,
    );

    // 3. Seed the 12 roles.
    for (const role of ROLES) {
      await queryRunner.query(
        `INSERT INTO "roles" ("id", "created_at", "updated_at", "is_deleted", "type", "key", "is_admin")
         VALUES (uuid_generate_v4(), now(), now(), false, $1, $2, $3)`,
        [role.name, role.key, role.isAdmin],
      );
    }

    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "UQ_roles_key" UNIQUE ("key")`,
    );

    // 3. Add the FK column on club_member.
    await queryRunner.query(
      `ALTER TABLE "club_member" ADD COLUMN "role_id" uuid`,
    );

    // 4. Backfill existing members. Old enum -> new role.
    //    OWNER/ADMIN collapse into an admin title (PRESIDENT); MEMBER -> MEMBER.
    await queryRunner.query(
      `UPDATE "club_member" SET "role_id" = (SELECT "id" FROM "roles" WHERE "key" = 'MEMBER') WHERE "role" = 'MEMBER'`,
    );
    await queryRunner.query(
      `UPDATE "club_member" SET "role_id" = (SELECT "id" FROM "roles" WHERE "key" = 'PRESIDENT') WHERE "role" IN ('ADMIN', 'OWNER')`,
    );

    // 5. Make it NOT NULL + add the foreign key constraint.
    await queryRunner.query(
      `ALTER TABLE "club_member" ALTER COLUMN "role_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_member" ADD CONSTRAINT "FK_club_member_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id")`,
    );

    // 6. Drop the obsolete enum column + type.
    await queryRunner.query(`ALTER TABLE "club_member" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."club_member_role_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create the enum column, restore values, drop the FK + role_id.
    await queryRunner.query(
      `CREATE TYPE "public"."club_member_role_enum" AS ENUM('MEMBER','ADMIN','OWNER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_member" ADD COLUMN "role" "public"."club_member_role_enum" NOT NULL DEFAULT 'MEMBER'`,
    );
    await queryRunner.query(
      `UPDATE "club_member" SET "role" = CASE WHEN (SELECT "is_admin" FROM "roles" WHERE "roles"."id" = "club_member"."role_id") THEN 'ADMIN' ELSE 'MEMBER' END`,
    );

    await queryRunner.query(
      `ALTER TABLE "club_member" DROP CONSTRAINT "FK_club_member_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_member" DROP COLUMN "role_id"`,
    );

    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "UQ_roles_key"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "key"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "is_admin"`);
    await queryRunner.query(`DELETE FROM "roles"`);
  }
}
