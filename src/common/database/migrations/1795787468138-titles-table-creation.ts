import type { MigrationInterface, QueryRunner } from 'typeorm'

export class TitlesTableCreation1795787468138 implements MigrationInterface {
  name = 'TitlesTableCreation1795787468138'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "titles" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" character varying NOT NULL,
                "name" character varying NOT NULL,
                "scope" text NOT NULL,
                CONSTRAINT "PK_7c5aeca381c331c3aaf9d50931c" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            ALTER TABLE "titles"
            ADD CONSTRAINT "FK_e14023392eb3a694a6ca0f9b0b3" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "titles" DROP CONSTRAINT "FK_e14023392eb3a694a6ca0f9b0b3"
        `)
    await queryRunner.query(`
            DROP TABLE "titles"
        `)
  }
}
