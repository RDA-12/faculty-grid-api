import type { MigrationInterface, QueryRunner } from 'typeorm'

export class RefreshTokenTableCreation1795013575270 implements MigrationInterface {
  name = 'RefreshTokenTableCreation1795013575270'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" text NOT NULL,
                "family_id" text NOT NULL,
                "user_id" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "family_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "used_at" TIMESTAMP WITH TIME ZONE,
                "revoked" boolean NOT NULL DEFAULT false,
                "claims" jsonb,
                CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "refresh_tokens_family_expires_at_idx" ON "refresh_tokens" ("family_expires_at")
        `)
    await queryRunner.query(`
            CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" ("user_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens" ("family_id")
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."refresh_tokens_family_id_idx"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."refresh_tokens_user_id_idx"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."refresh_tokens_family_expires_at_idx"
        `)
    await queryRunner.query(`
            DROP TABLE "refresh_tokens"
        `)
  }
}
