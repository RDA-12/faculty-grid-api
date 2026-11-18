import { Injectable } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { UserCredential } from '../entities/user-credential.entity.js'

/**
 * Repository to manage credential data
 */
@Injectable()
export class CredentialRepository {
  /**
   * Return UserCredential for provided userId
   */
  async getByUserId(userId: string): Promise<AppResult<UserCredential>> {
    // TODO(RDA12): implement getByUserId on CredentialRepository
    return AppResult.success(
      new UserCredential({ userId: userId, hashedPassword: 'hashed' }),
    )
  }
}
