import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSocialLinksToMeetings1772300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "social_links" text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP COLUMN IF EXISTS "social_links"`,
    );
  }
}
