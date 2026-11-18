import { PasswordHasher } from '@nestjs/authentication'
import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'

/**
 * Handle hashing and verifying password
 */
@Injectable()
export class AppPasswordHasher {
  constructor(private readonly nestPasswordHasher: PasswordHasher) {
    this.logger = new Logger('AppPasswordHasher')
  }

  private readonly logger: Logger

  async verify(password: string, encoded: string): Promise<AppResult<boolean>> {
    try {
      this.logger.debug(
        'delegate verifying password to PasswordHasher from nestjs',
      )
      const verified = await this.nestPasswordHasher.verify(password, encoded)
      this.logger.debug('password verification success')
      return AppResult.success(verified)
    } catch (error) {
      this.logger.error(`failed to verify password: ${error as Error}`)
      return AppResult.failed(new AppException(`${error as Error}`))
    }
  }
}
