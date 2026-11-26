import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { UserToken } from '../entities/user-credential.entity.js'
import { AppResult } from '../../common/app-result.js'
import { JWT } from '../utils/jwt.util.js'

/**
 * Use case to refresh access token with refresh token
 */
@Injectable()
export class RefreshAccessTokenUseCase implements PromiseUseCase<
  string,
  UserToken
> {
  constructor(private readonly jwt: JWT) {
    this.logger = new Logger('RefreshAccessTokenUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<UserToken>> {
    this.logger.debug('delegate refresh access token to JWT', { params })
    return this.jwt.refresh(params)
  }
}
