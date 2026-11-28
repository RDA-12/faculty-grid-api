import { Module } from '@nestjs/common'
import { UserModule } from './user/user.module.js'
import { AuthModule } from './auth/auth.module.js'
import { DatabaseModule } from './common/database/database.module.js'
import { ConfigModule } from '@nestjs/config'
import { appConfig } from './common/config.js'
import { AuthzModule } from './authz/authz.module.js'
import { OrganizationModule } from './organization/organization.module.js'
import { LecturerModule } from './lecturer/lecturer.module.js'

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
    AuthzModule,
    OrganizationModule,
    LecturerModule,
  ],
})
export class AppModule {}
