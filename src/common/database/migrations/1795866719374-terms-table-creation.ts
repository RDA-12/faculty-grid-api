import type { MigrationInterface, QueryRunner } from 'typeorm'

export class TermsTableCreation1795866719374 implements MigrationInterface {
  name = 'TermsTableCreation1795866719374'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "terms" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" character varying NOT NULL,
                "academic_year_id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "start_date" date NOT NULL,
                "end_date" date NOT NULL,
                "status" text NOT NULL DEFAULT 'planned',
                CONSTRAINT "PK_33b6fe77d6ace7ff43cc8a65958" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_terms_single_active" ON "terms" ("status")
            WHERE "status" = 'active'
                AND "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_terms_academic_year_name_active" ON "terms" ("academic_year_id", "name")
            WHERE "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "terms"
            ADD CONSTRAINT "FK_9528adc279bc35cf3a37303cf00" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "terms"
            ADD CONSTRAINT "FK_733590da28e000d72a406ff95a9" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "terms" DROP CONSTRAINT "FK_733590da28e000d72a406ff95a9"
        `)
    await queryRunner.query(`
            ALTER TABLE "terms" DROP CONSTRAINT "FK_9528adc279bc35cf3a37303cf00"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."UQ_terms_academic_year_name_active"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."UQ_terms_single_active"
        `)
    await queryRunner.query(`
            DROP TABLE "terms"
        `)
  }
}
