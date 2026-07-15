import { MigrationInterface, QueryRunner, TableColumn, TableUnique } from 'typeorm';

export class RemoveGuestColumnsFromClubMember1773500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Guests are no longer stored in club_member; remove any orphan rows
    await queryRunner.query(`DELETE FROM "club_member" WHERE "user_id" IS NULL`);

    // Drop the unique constraint on (club_id, member_email)
    await queryRunner.dropUniqueConstraint(
      'club_member',
      'UQ_189a68d36ea612f653d4c4b00d1',
    );

    // Drop denormalized guest/name columns and the toastmaster id column
    await queryRunner.dropColumn('club_member', 'member_name');
    await queryRunner.dropColumn('club_member', 'member_email');
    await queryRunner.dropColumn('club_member', 'toastmaster_id');

    // Every club member must now reference a registered user
    await queryRunner.changeColumn(
      'club_member',
      'user_id',
      new TableColumn({
        name: 'user_id',
        type: 'uuid',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'club_member',
      'user_id',
      new TableColumn({
        name: 'user_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'club_member',
      new TableColumn({
        name: 'member_name',
        type: 'varchar',
        length: '100',
        isNullable: false,
      }),
    );
    await queryRunner.addColumn(
      'club_member',
      new TableColumn({
        name: 'member_email',
        type: 'varchar',
        length: '100',
        isNullable: false,
      }),
    );
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

    await queryRunner.createUniqueConstraint(
      'club_member',
      new TableUnique({
        name: 'UQ_189a68d36ea612f653d4c4b00d1',
        columnNames: ['club_id', 'member_email'],
      }),
    );
  }
}
