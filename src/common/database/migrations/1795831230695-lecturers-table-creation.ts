import type { MigrationInterface, QueryRunner } from 'typeorm'

export class LecturersTableCreation1795831230695 implements MigrationInterface {
  name = 'LecturersTableCreation1795831230695'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "lecturers" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" character varying NOT NULL,
                "name" character varying NOT NULL,
                "program_id" character varying NOT NULL,
                "employment_status" text NOT NULL,
                "rank_id" character varying,
                "functional_rank_id" character varying,
                "academic_degree" text NOT NULL,
                CONSTRAINT "PK_4dffa0b38d36bfd09610d64b399" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturers"
            ADD CONSTRAINT "FK_a282ba4a5da03c502e0b4dc547b" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturers"
            ADD CONSTRAINT "FK_4495f00b77a40bdcd2f0ac2ac84" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturers"
            ADD CONSTRAINT "FK_ada497bb3dc5af4e67ec92166dd" FOREIGN KEY ("rank_id") REFERENCES "ranks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturers"
            ADD CONSTRAINT "FK_a0067ffa1eea8621058eb03cc32" FOREIGN KEY ("functional_rank_id") REFERENCES "functional_ranks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "lecturers" DROP CONSTRAINT "FK_a0067ffa1eea8621058eb03cc32"
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturers" DROP CONSTRAINT "FK_ada497bb3dc5af4e67ec92166dd"
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturers" DROP CONSTRAINT "FK_4495f00b77a40bdcd2f0ac2ac84"
        `)
    await queryRunner.query(`
            ALTER TABLE "lecturers" DROP CONSTRAINT "FK_a282ba4a5da03c502e0b4dc547b"
        `)
    await queryRunner.query(`
            DROP TABLE "lecturers"
        `)
  }
}
