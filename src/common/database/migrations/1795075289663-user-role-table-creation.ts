import type { MigrationInterface, QueryRunner } from 'typeorm'

export class UserRoleTableCreation1795075289663 implements MigrationInterface {
  name = 'UserRoleTableCreation1795075289663'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "user_id" character varying NOT NULL,
                "role" text NOT NULL,
                CONSTRAINT "UQ_09d115a69b6014d324d592f9c42" UNIQUE ("user_id", "role"),
                CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "user_roles"
            ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"
        `)
    await queryRunner.query(`
            DROP TABLE "user_roles"
        `)
  }
}
