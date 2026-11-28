import type { MigrationInterface, QueryRunner } from 'typeorm'

export class FunctionalRanksTableCreation1795789896197 implements MigrationInterface {
  name = 'FunctionalRanksTableCreation1795789896197'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "functional_ranks" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" character varying NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "PK_a2fad72bf93365147f5a5814f66" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_functional_ranks_name_active" ON "functional_ranks" ("name")
            WHERE "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "functional_ranks"
            ADD CONSTRAINT "FK_d53b972f4ae7b6883b145078587" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "functional_ranks" DROP CONSTRAINT "FK_d53b972f4ae7b6883b145078587"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."UQ_functional_ranks_name_active"
        `)
    await queryRunner.query(`
            DROP TABLE "functional_ranks"
        `)
  }
}
