import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1767128241076 implements MigrationInterface {
  name = 'InitialMigration1767128241076';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."agenda_items_system_role_enum" AS ENUM('PRESIDENT', 'SAA', 'TOASTMASTER', 'TIMER', 'GRAMMARIAN', 'AH_COUNTER', 'GENERAL_EVALUATOR', 'TABLE_TOPIC_MASTER', 'SPEAKER', 'EVALUATOR')`,
    );
    await queryRunner.query(
      `CREATE TABLE "agenda_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "title" character varying NOT NULL, "system_role" "public"."agenda_items_system_role_enum", "custom_role" text, "duration" integer NOT NULL, "sequence" integer NOT NULL, "agenda_template_id" uuid, CONSTRAINT "PK_7274c40301175b4b4b347820d0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "agenda_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "description" text, "club_id" character varying, "is_default" boolean NOT NULL DEFAULT false, "clubId" uuid, CONSTRAINT "PK_f784a4718923e60fb15d27dfefc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "clubs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(100) NOT NULL, "description" character varying(255), "district" character varying(100), "area" character varying(100), "division" character varying(100), "owner_id" uuid NOT NULL, "meeting_frequency" character varying NOT NULL DEFAULT 'WEEKLY', "club_code" character varying(20) NOT NULL, CONSTRAINT "UQ_1ea10697dcadc5cbce2dcf26c34" UNIQUE ("club_code"), CONSTRAINT "PK_bb09bd0c8d5238aeaa8f86ee0d4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."club_member_role_enum" AS ENUM('MEMBER', 'ADMIN', 'OWNER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "club_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "user_id" uuid, "club_id" uuid NOT NULL, "member_name" character varying(100) NOT NULL, "member_email" character varying(100) NOT NULL, "date_joined" TIMESTAMP NOT NULL DEFAULT now(), "role" "public"."club_member_role_enum" NOT NULL DEFAULT 'MEMBER', CONSTRAINT "UQ_7835426fbdcab7105690d6a0ca2" UNIQUE ("club_id", "user_id"), CONSTRAINT "UQ_189a68d36ea612f653d4c4b00d1" UNIQUE ("club_id", "member_email"), CONSTRAINT "PK_d6cfd9e17ca944f4eeedf5ef908" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "email" character varying NOT NULL, "password" character varying(255) NOT NULL, "full_name" character varying(100) NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "agendas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "title" character varying(255) NOT NULL, "role_name" character varying NOT NULL, "duration" integer NOT NULL, "sequence" integer NOT NULL, "meeting_id" uuid NOT NULL, "member_id" uuid, "member_name" character varying NOT NULL, "is_guest" boolean NOT NULL, "notes" text, CONSTRAINT "UQ_0f1db2098fcfa669225878a9788" UNIQUE ("meeting_id", "sequence"), CONSTRAINT "PK_5fea8668c8712b8292ded824549" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meetings_status_enum" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "meetings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "meeting_no" integer NOT NULL, "theme" character varying(255) NOT NULL, "date" TIMESTAMP NOT NULL, "time" TIME NOT NULL, "venue" character varying(100) NOT NULL, "notes" character varying(999), "status" "public"."meetings_status_enum" NOT NULL DEFAULT 'SCHEDULED', "club_id" uuid NOT NULL, CONSTRAINT "PK_aa73be861afa77eb4ed31f3ed57" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "agenda_items" ADD CONSTRAINT "FK_da5c1b4b1eb20f7e294f6e3d0d5" FOREIGN KEY ("agenda_template_id") REFERENCES "agenda_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "agenda_templates" ADD CONSTRAINT "FK_027729eca5fb0be8c2211ab9902" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" ADD CONSTRAINT "FK_b208f1bfca28ae915ab2557e75e" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_member" ADD CONSTRAINT "FK_bde5bad4e43fbcefa06b9d6a9d9" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_member" ADD CONSTRAINT "FK_439b7482544b3a96f620e5115d4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "agendas" ADD CONSTRAINT "FK_f6cfec172c2ea645910467aa064" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "agendas" ADD CONSTRAINT "FK_26db175795d771e051c1d3c6f5a" FOREIGN KEY ("member_id") REFERENCES "club_member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD CONSTRAINT "FK_86cdfb64429095d317bf46ee506" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP CONSTRAINT "FK_86cdfb64429095d317bf46ee506"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agendas" DROP CONSTRAINT "FK_26db175795d771e051c1d3c6f5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agendas" DROP CONSTRAINT "FK_f6cfec172c2ea645910467aa064"`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_member" DROP CONSTRAINT "FK_439b7482544b3a96f620e5115d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "club_member" DROP CONSTRAINT "FK_bde5bad4e43fbcefa06b9d6a9d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clubs" DROP CONSTRAINT "FK_b208f1bfca28ae915ab2557e75e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agenda_templates" DROP CONSTRAINT "FK_027729eca5fb0be8c2211ab9902"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agenda_items" DROP CONSTRAINT "FK_da5c1b4b1eb20f7e294f6e3d0d5"`,
    );
    await queryRunner.query(`DROP TABLE "meetings"`);
    await queryRunner.query(`DROP TYPE "public"."meetings_status_enum"`);
    await queryRunner.query(`DROP TABLE "agendas"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "club_member"`);
    await queryRunner.query(`DROP TYPE "public"."club_member_role_enum"`);
    await queryRunner.query(`DROP TABLE "clubs"`);
    await queryRunner.query(`DROP TABLE "agenda_templates"`);
    await queryRunner.query(`DROP TABLE "agenda_items"`);
    await queryRunner.query(
      `DROP TYPE "public"."agenda_items_system_role_enum"`,
    );
  }
}
