import type { MigrationInterface, QueryRunner } from 'typeorm'

export class RanksTableCreation1795789702550 implements MigrationInterface {
  name = 'RanksTableCreation1795789702550'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "ranks" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" character varying NOT NULL,
                "name" character varying NOT NULL,
                "grade" character varying NOT NULL,
                CONSTRAINT "PK_7620a297228c6e9ed28e9fd07e4" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_ranks_name_grade_active" ON "ranks" ("name", "grade")
            WHERE "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "ranks"
            ADD CONSTRAINT "FK_11796114e089be4049888d1834f" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "ranks" DROP CONSTRAINT "FK_11796114e089be4049888d1834f"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."UQ_ranks_name_grade_active"
        `)
    await queryRunner.query(`
            DROP TABLE "ranks"
        `)
  }
}
