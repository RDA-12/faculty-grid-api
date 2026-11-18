import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { UserToken } from '../entities/user-credential.entity.js'
import {
  AuthenticationRegistry,
  JwtBearerProvider,
  JwtClaims,
  TokenService,
} from '@nestjs/authentication'
import { UnexpectedException } from '../../common/app-exception.js'
import { User } from '../../user/entities/user.entity.js'
import { GetUserByIdUseCase } from '../../user/use-cases/get-user-by-id.use-case.js'

/**
 * Manage encoding and decoding jwt token
 */
@Injectable()
export class JWT extends JwtBearerProvider<User> {
  constructor(
    private readonly nestTokenService: TokenService,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    registry: AuthenticationRegistry,
  ) {
    super()
    this.logger = new Logger('JWT')
    registry.registerProvider(this)
  }

  private readonly logger: Logger

  async issue(userId: string): Promise<AppResult<UserToken>> {
    try {
      this.logger.debug('delegate issueing token to TokenService from nestjs')
      const issuedToken = await this.nestTokenService.issue(userId, {
        method: 'password',
      })
      this.logger.debug('token issued successfully')
      return AppResult.success(new UserToken(issuedToken))
    } catch (error) {
      this.logger.error(`failed to issue token: ${error as Error}`)
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async validate({ sub }: JwtClaims): Promise<User | null | undefined> {
    if (!sub) {
      this.logger.debug('user id not found within jwt claims')
      return
    }
    this.logger.debug('delegating get user by id to GetUserByIdUseCase')
    const result = await this.getUserByIdUseCase.execute(sub)

    if (result.exception) {
      this.logger.debug('failed to get user by id')
      return null
    }

    this.logger.debug('user obtained')
    return result.data!
  }
}
