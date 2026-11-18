import { Module } from '@nestjs/common'
import { UserModule } from './user/user.module.js'
import { AuthModule } from './auth/auth.module.js'
import { DatabaseModule } from './common/database/database.module.js'

@Module({
  imports: [DatabaseModule, UserModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
