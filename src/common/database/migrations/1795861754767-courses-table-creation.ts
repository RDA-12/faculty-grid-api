import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CoursesTableCreation1795861754767 implements MigrationInterface {
  name = 'CoursesTableCreation1795861754767'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "courses" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" character varying NOT NULL,
                "code" character varying NOT NULL,
                "name" character varying NOT NULL,
                "credits" integer NOT NULL,
                "semester" integer NOT NULL,
                "course_type" text NOT NULL,
                "program_id" character varying NOT NULL,
                CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_courses_program_code_active" ON "courses" ("program_id", "code")
            WHERE "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "courses"
            ADD CONSTRAINT "FK_16fcd8ab8bc042688984d5b3934" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "courses"
            ADD CONSTRAINT "FK_ef3a23e394203eb11b06b77f695" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "courses" DROP CONSTRAINT "FK_ef3a23e394203eb11b06b77f695"
        `)
    await queryRunner.query(`
            ALTER TABLE "courses" DROP CONSTRAINT "FK_16fcd8ab8bc042688984d5b3934"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."UQ_courses_program_code_active"
        `)
    await queryRunner.query(`
            DROP TABLE "courses"
        `)
  }
}
