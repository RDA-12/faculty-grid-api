import { PasswordHasher } from '@nestjs/authentication'
import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { UnexpectedException } from '../../common/app-exception.js'

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
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async hash(password: string): Promise<AppResult<string>> {
    try {
      this.logger.debug(
        'delegate hashing password to PasswordHasher from nestjs',
      )
      const hashed = await this.nestPasswordHasher.hash(password)
      this.logger.debug('password hashed')
      return AppResult.success(hashed)
    } catch (error) {
      this.logger.error(`failed to hash password: ${error as Error}`)
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }
}
