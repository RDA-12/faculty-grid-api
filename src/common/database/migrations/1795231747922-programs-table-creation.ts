import { MigrationInterface, QueryRunner } from 'typeorm'

export class ProgramsTableCreation1795231747922 implements MigrationInterface {
  name = 'ProgramsTableCreation1795231747922'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "programs" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" character varying NOT NULL,
                "name" character varying NOT NULL,
                "degree_level" text NOT NULL,
                "faculty_id" character varying NOT NULL,
                CONSTRAINT "PK_d43c664bcaafc0e8a06dfd34e05" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            ALTER TABLE "programs"
            ADD CONSTRAINT "FK_49427782d15ccb8a84543220ab1" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "programs"
            ADD CONSTRAINT "FK_cf0a1ffcd588d023298898f900d" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "programs" DROP CONSTRAINT "FK_cf0a1ffcd588d023298898f900d"
        `)
    await queryRunner.query(`
            ALTER TABLE "programs" DROP CONSTRAINT "FK_49427782d15ccb8a84543220ab1"
        `)
    await queryRunner.query(`
            DROP TABLE "programs"
        `)
  }
}
