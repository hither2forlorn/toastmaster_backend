import { MigrationInterface, QueryRunner } from "typeorm";

export class AgendaReport1769678778802 implements MigrationInterface {
    name = 'AgendaReport1769678778802'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."agenda_reports_report_type_enum" AS ENUM('GRAMMARIAN', 'AH_COUNTER')`);
        await queryRunner.query(`CREATE TABLE "agenda_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "agenda_id" uuid NOT NULL, "report_type" "public"."agenda_reports_report_type_enum" NOT NULL, "word_of_the_day" character varying(100), "word_of_the_day_definition" text, "grammar_notes" text, "member_evaluations" jsonb, "filler_word_counts" jsonb, "overall_notes" text, CONSTRAINT "PK_651c81359ef15fd98562bb77d14" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "club_member" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "agenda_reports" ADD CONSTRAINT "FK_8cefc2f461c6640b884165e05a0" FOREIGN KEY ("agenda_id") REFERENCES "agendas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agenda_reports" DROP CONSTRAINT "FK_8cefc2f461c6640b884165e05a0"`);
        await queryRunner.query(`ALTER TABLE "club_member" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TABLE "agenda_reports"`);
        await queryRunner.query(`DROP TYPE "public"."agenda_reports_report_type_enum"`);
    }

}
