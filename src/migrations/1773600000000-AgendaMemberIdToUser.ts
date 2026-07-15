import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgendaMemberIdToUser1773600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the old FK to club_member so we can rewrite member_id freely.
    await queryRunner.query(
      `ALTER TABLE "agendas" DROP CONSTRAINT "FK_26db175795d771e051c1d3c6f5a"`,
    );

    // 2. Backfill: agendas.member_id currently holds club_member.id.
    //    Map it to the corresponding users.id via club_member.user_id.
    await queryRunner.query(
      `UPDATE "agendas" a
       SET "member_id" = cm."user_id"
       FROM "club_member" cm
       WHERE a."member_id" = cm."id"
       AND a."member_id" IS NOT NULL`,
    );

    // 3. Add FK to users.
    await queryRunner.query(
      `ALTER TABLE "agendas" ADD CONSTRAINT "FK_agendas_user"
       FOREIGN KEY ("member_id") REFERENCES "users"("id")
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the FK to users so we can rewrite member_id freely.
    await queryRunner.query(
      `ALTER TABLE "agendas" DROP CONSTRAINT "FK_agendas_user"`,
    );

    // 2. Reverse backfill: map users.id back to the club_member.id of the
    //    same user within the meeting's club.
    await queryRunner.query(
      `UPDATE "agendas" a
       SET "member_id" = cm."id"
       FROM "meetings" m
       INNER JOIN "club_member" cm
         ON cm."user_id" = a."member_id"
        AND cm."club_id" = m."club_id"
       WHERE a."member_id" IS NOT NULL
       AND a."meeting_id" = m."id"`,
    );

    // 3. Re-add the FK to club_member.
    await queryRunner.query(
      `ALTER TABLE "agendas" ADD CONSTRAINT "FK_26db175795d771e051c1d3c6f5a"
       FOREIGN KEY ("member_id") REFERENCES "club_member"("id")
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
