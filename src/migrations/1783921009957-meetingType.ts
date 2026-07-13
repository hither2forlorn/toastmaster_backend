import { MigrationInterface, QueryRunner } from "typeorm";

export class MeetingType1783921009957 implements MigrationInterface {
    name = 'MeetingType1783921009957'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."meetings_meeting_type_enum" AS ENUM('ONLINE', 'PHYSICAL', 'HYBRID')`);
        await queryRunner.query(`ALTER TABLE "meetings" ADD "meeting_type" "public"."meetings_meeting_type_enum" NOT NULL DEFAULT 'PHYSICAL'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meetings" DROP COLUMN "meeting_type"`);
        await queryRunner.query(`DROP TYPE "public"."meetings_meeting_type_enum"`);
    }

}
