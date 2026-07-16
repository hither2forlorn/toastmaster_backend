import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWordAndIdiomOfTheDayToMeetings1773601000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "word_of_the_day" varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "idiom_of_the_day" varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP COLUMN IF EXISTS "idiom_of_the_day"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP COLUMN IF EXISTS "word_of_the_day"`,
    );
  }
}
