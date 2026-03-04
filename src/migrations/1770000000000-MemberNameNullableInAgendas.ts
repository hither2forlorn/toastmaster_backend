import { MigrationInterface, QueryRunner } from 'typeorm';

export class MemberNameNullableInAgendas1770000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make member_name nullable — names for club members are now derived
    // from the club_member table via JOIN instead of being stored here.
    await queryRunner.query(
      `ALTER TABLE "agendas" ALTER COLUMN "member_name" DROP NOT NULL`,
    );

    // Clear the redundant stored name for existing non-guest agenda rows
    // (is_guest = false means it is a club-member assignment).
    await queryRunner.query(
      `UPDATE "agendas" SET "member_name" = NULL WHERE "is_guest" = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore stored member names from the club_member table before
    // making the column NOT NULL again.
    await queryRunner.query(
      `UPDATE "agendas" a
       SET "member_name" = cm."member_name"
       FROM "club_member" cm
       WHERE a."member_id" = cm."id"
         AND a."is_guest" = false
         AND a."member_name" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "agendas" ALTER COLUMN "member_name" SET NOT NULL`,
    );
  }
}
