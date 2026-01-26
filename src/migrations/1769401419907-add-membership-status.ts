import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMembershipStatus1769401419907 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('club_member', new TableColumn({
      name: 'status',
      type: 'enum',
      enum: ['pending', 'active', 'rejected'],
      isNullable: true
    }));
    
    await queryRunner.query(
      `UPDATE club_member SET status = 'active' WHERE status IS NULL`
    );
    
    await queryRunner.changeColumn('club_member', 'status', new TableColumn({
      name: 'status',
      type: 'enum',
      enum: ['pending', 'active', 'rejected'],
      isNullable: false,
      default: "'pending'"
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('club_member', 'status');
  }
}