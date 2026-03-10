import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddToastmasterIdToMember1773163386300 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'club_member',
      new TableColumn({
        name: 'toastmaster_id',
        type: 'varchar',
        length: '20',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('club_member', 'toastmaster_id');
  }
}
