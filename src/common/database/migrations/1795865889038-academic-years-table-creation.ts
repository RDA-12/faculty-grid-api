import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AcademicYearsTableCreation1795865889038 implements MigrationInterface {
  name = 'AcademicYearsTableCreation1795865889038'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "academic_years" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" character varying NOT NULL,
                "name" character varying NOT NULL,
                "start_date" date NOT NULL,
                "end_date" date NOT NULL,
                "status" text NOT NULL DEFAULT 'planned',
                CONSTRAINT "PK_2021b90bfbfa6c9da7df34ca1cf" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_academic_years_single_active" ON "academic_years" ("status")
            WHERE "status" = 'active'
                AND "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_academic_years_name_active" ON "academic_years" ("name")
            WHERE "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "academic_years"
            ADD CONSTRAINT "FK_971b2ef357cdd14b864fed4b41a" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "academic_years" DROP CONSTRAINT "FK_971b2ef357cdd14b864fed4b41a"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."UQ_academic_years_name_active"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."UQ_academic_years_single_active"
        `)
    await queryRunner.query(`
            DROP TABLE "academic_years"
        `)
  }
}
