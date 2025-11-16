import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddConstraintsJsonToGames1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const table = await queryRunner.getTable('games');
    const hasColumn = table?.findColumnByName('constraints_json');
    
    if (!hasColumn) {
      await queryRunner.addColumn(
        'games',
        new TableColumn({
          name: 'constraints_json',
          type: 'text',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('games');
    const hasColumn = table?.findColumnByName('constraints_json');
    
    if (hasColumn) {
      await queryRunner.dropColumn('games', 'constraints_json');
    }
  }
}

