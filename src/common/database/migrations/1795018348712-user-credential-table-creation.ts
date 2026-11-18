import { MigrationInterface, QueryRunner } from 'typeorm'

export class UserCredentialTableCreation1795018348712 implements MigrationInterface {
  name = 'UserCredentialTableCreation1795018348712'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "user_credentials" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "hashed_password" character varying NOT NULL,
                "user_id" character varying,
                CONSTRAINT "REL_dd0918407944553611bb3eb3dd" UNIQUE ("user_id"),
                CONSTRAINT "PK_5cadc04d03e2d9fe76e1b44eb34" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_dd0918407944553611bb3eb3dd" ON "user_credentials" ("user_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "user_credentials"
            ADD CONSTRAINT "FK_dd0918407944553611bb3eb3ddc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user_credentials" DROP CONSTRAINT "FK_dd0918407944553611bb3eb3ddc"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_dd0918407944553611bb3eb3dd"
        `)
    await queryRunner.query(`
            DROP TABLE "user_credentials"
        `)
  }
}
