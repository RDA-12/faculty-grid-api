import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { UserToken } from '../entities/user-credential.entity.js'
import { TokenService } from '@nestjs/authentication'
import { AppException } from '../../common/app-exception.js'

/**
 * Manage encoding and decoding jwt token
 */
@Injectable()
export class JWT {
  constructor(private readonly nestTokenService: TokenService) {
    this.logger = new Logger('JWT')
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
      return AppResult.failed(
        new AppException({
          status: 500,
          title: 'Failed issueing new jwt token',
          detail: `${error as Error}`,
        }),
      )
    }
  }
}
