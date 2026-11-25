import type { MigrationInterface, QueryRunner } from 'typeorm'

export class UserCredentialUsersFkChange1795055238153 implements MigrationInterface {
  name = 'UserCredentialUsersFkChange1795055238153'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user_credentials" DROP CONSTRAINT "FK_dd0918407944553611bb3eb3ddc"
        `)
    await queryRunner.query(`
            ALTER TABLE "user_credentials"
            ALTER COLUMN "user_id"
            SET NOT NULL
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
            ALTER TABLE "user_credentials"
            ALTER COLUMN "user_id" DROP NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "user_credentials"
            ADD CONSTRAINT "FK_dd0918407944553611bb3eb3ddc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }
}
