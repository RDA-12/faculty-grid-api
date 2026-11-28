import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDisplayNameToLecturers1795832865399 implements MigrationInterface {
  name = 'AddDisplayNameToLecturers1795832865399'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "lecturers"
            ADD "display_name" character varying NOT NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "lecturers" DROP COLUMN "display_name"
        `)
  }
}
