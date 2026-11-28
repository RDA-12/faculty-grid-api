import type { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateRanksReplaceGradeWithType1795826511881 implements MigrationInterface {
  name = 'UpdateRanksReplaceGradeWithType1795826511881'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."UQ_ranks_name_grade_active"
        `)
    await queryRunner.query(`
            ALTER TABLE "ranks"
                RENAME COLUMN "grade" TO "type"
        `)
    await queryRunner.query(`
            ALTER TABLE "ranks" DROP COLUMN "type"
        `)
    await queryRunner.query(`
            ALTER TABLE "ranks"
            ADD "type" text NOT NULL
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_ranks_name_type_active" ON "ranks" ("name", "type")
            WHERE "deleted_at" IS NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."UQ_ranks_name_type_active"
        `)
    await queryRunner.query(`
            ALTER TABLE "ranks" DROP COLUMN "type"
        `)
    await queryRunner.query(`
            ALTER TABLE "ranks"
            ADD "type" character varying NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "ranks"
                RENAME COLUMN "type" TO "grade"
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_ranks_name_grade_active" ON "ranks" USING btree ("grade", "name")
            WHERE (deleted_at IS NULL)
        `)
  }
}
