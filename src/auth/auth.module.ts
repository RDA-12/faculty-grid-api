import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module.js'
import { AuthenticationModule } from '@nestjs/authentication'
import { LoginUseCase } from './use-cases/login.use-case.js'
import { CredentialRepository } from './repositories/credential.repository.js'
import { AppPasswordHasher } from './utils/app-password-hasher.util.js'
import { JWT } from './utils/jwt.util.js'
import { AuthController } from './controllers/auth.controller.js'
import { RegisterAdminUseCase } from './use-cases/register-admin.user-case.js'
import { ConfigService } from '@nestjs/config'
import { SecretConfig } from '../common/config.js'
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js'
import { AuthzModule } from '../authz/authz.module.js'

/**
 * Handle user authentication
 *
 * Focus primarily on ensuring user is recognized.
 *
 * Task to check whether user can do something is handled by AuthzModule
 */
@Module({
  imports: [
    AuthenticationModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<SecretConfig>('secret')!

        return {
          accessToken: {
            key: secret.jwt,
            issuer: 'http://localhost:8000',
            audience: 'web',
            ttl: '15m',
          },
        }
      },
      inject: [ConfigService],
    }),
    UserModule,
    AuthzModule,
  ],
  controllers: [AuthController],
  providers: [
    RefreshTokenRepository,
    CredentialRepository,
    AppPasswordHasher,
    JWT,
    LoginUseCase,
    RegisterAdminUseCase,
  ],
})
export class AuthModule {}
