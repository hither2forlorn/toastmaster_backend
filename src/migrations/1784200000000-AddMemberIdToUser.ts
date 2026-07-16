import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMemberIdToUser1784200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'member_id',
        type: 'varchar',
        length: '20',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'member_id');
  }
}
