import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSocialLinksToClubs1783838993339 implements MigrationInterface {
    name = 'AddSocialLinksToClubs1783838993339'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clubs" ADD "social_links" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clubs" DROP COLUMN "social_links"`);
    }

}
