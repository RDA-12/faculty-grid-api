import { Module } from '@nestjs/common'
import { UserModule } from './user/user.module.js'
import { AuthModule } from './auth/auth.module.js'
import { DatabaseModule } from './common/database/database.module.js'
import { ConfigModule } from '@nestjs/config'
import { appConfig } from './common/config.js'

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig],
    }),
  ],
})
export class AppModule {}
