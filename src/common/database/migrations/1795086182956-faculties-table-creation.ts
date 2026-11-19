import { MigrationInterface, QueryRunner } from 'typeorm'

export class FacultiesTableCreation1795086182956 implements MigrationInterface {
  name = 'FacultiesTableCreation1795086182956'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "faculties" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" character varying NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "PK_fd83e4a09c7182ccf7bdb3770b9" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            ALTER TABLE "faculties"
            ADD CONSTRAINT "FK_bc4fcb8379181d890bdf340e5a5" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "faculties" DROP CONSTRAINT "FK_bc4fcb8379181d890bdf340e5a5"
        `)
    await queryRunner.query(`
            DROP TABLE "faculties"
        `)
  }
}
