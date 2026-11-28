import type { MigrationInterface, QueryRunner } from 'typeorm'

export class LecturerTitlesTableCreation1795836090612 implements MigrationInterface {
  name = 'LecturerTitlesTableCreation1795836090612'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "lecturer_titles" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" character varying NOT NULL,
                "lecturer_id" character varying NOT NULL,
                "title_id" character varying NOT NULL,
                "faculty_id" character varying,
                "program_id" character varying,
                "start_date" date NOT NULL,
                "end_date" date,
                CONSTRAINT "PK_ce7efddd7bd9038aca2117d9818" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_lecturer_titles_title_program_active" ON "lecturer_titles" ("title_id", "program_id")
            WHERE "end_date" IS NULL
                AND "deleted_at" IS NULL
                AND "program_id" IS NOT NULL
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_lecturer_titles_title_faculty_active" ON "lecturer_titles" ("title_id", "faculty_id")
            WHERE "end_date" IS NULL
                AND "deleted_at" IS NULL
                AND "faculty_id" IS NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturer_titles"
            ADD CONSTRAINT "FK_0af3f8bc6bbb4d1de8f9e52209e" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturer_titles"
            ADD CONSTRAINT "FK_dfff4c97e23ac0029da7b94f3c9" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturer_titles"
            ADD CONSTRAINT "FK_a1fd14625b7b3eb3d65aca06ad7" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturer_titles"
            ADD CONSTRAINT "FK_e88ade417a7b4ed2a82f64eba99" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturer_titles"
            ADD CONSTRAINT "FK_78ea74641e722715b8a0e9c43d6" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "lecturer_titles" DROP CONSTRAINT "FK_78ea74641e722715b8a0e9c43d6"
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturer_titles" DROP CONSTRAINT "FK_e88ade417a7b4ed2a82f64eba99"
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturer_titles" DROP CONSTRAINT "FK_a1fd14625b7b3eb3d65aca06ad7"
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturer_titles" DROP CONSTRAINT "FK_dfff4c97e23ac0029da7b94f3c9"
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturer_titles" DROP CONSTRAINT "FK_0af3f8bc6bbb4d1de8f9e52209e"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."UQ_lecturer_titles_title_faculty_active"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."UQ_lecturer_titles_title_program_active"
        `)
    await queryRunner.query(`
            DROP TABLE "lecturer_titles"
        `)
  }
}
