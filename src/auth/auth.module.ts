import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module.js'
import { AuthenticationModule } from '@nestjs/authentication'
import { LoginUseCase } from './use-cases/login.use-case.js'
import { CredentialRepository } from './repositories/credential.repository.js'
import { AppPasswordHasher } from './utils/app-password-hasher.util.js'
import { JWT } from './utils/jwt.util.js'
import { AuthController } from './controllers/auth.controller.js'

/**
 * Handle user authentication
 *
 * Focus primarily on ensuring user is recognized.
 *
 * Task to check whether user can do something is handled by AuthzModule
 */
@Module({
  imports: [
    AuthenticationModule.forRoot({
      accessToken: {
        key:
          process.env.JWT_SECRET ??
          '3cc4238a01a83902c646ac6e4c288971dcaffc491d7477b8843504838e76d6ab',
        issuer: 'http://localhost:8000',
        audience: 'web',
        ttl: '15m',
      },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [CredentialRepository, AppPasswordHasher, JWT, LoginUseCase],
})
export class AuthModule {}
