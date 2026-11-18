import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { UserCredential } from '../entities/user-credential.entity.js'
import { DataSource, Repository } from 'typeorm'
import { UserCredentialDBEntity } from '../../common/database/entities/user-credential.entity.js'
import { NotFoundException } from '../../common/app-exception.js'

/**
 * Repository to manage credential data
 */
@Injectable()
export class CredentialRepository {
  constructor(dataSource: DataSource) {
    this.logger = new Logger('CredentialRepository')
    this.repository = dataSource.getRepository(UserCredentialDBEntity)
  }

  private readonly logger: Logger
  private readonly repository: Repository<UserCredentialDBEntity>

  /**
   * Return UserCredential for provided userId
   */
  async getByUserId(userId: string): Promise<AppResult<UserCredential>> {
    this.logger.debug('starts getting user credential by its id')
    const dbData = await this.repository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        user: true,
      },
    })
    if (!dbData) {
      this.logger.debug(`credential for user with ID ${userId} not found`)
      return AppResult.failed(
        new NotFoundException(
          `credential for user with ID ${userId} not found`,
        ),
      )
    }
    this.logger.debug('credential found')
    return AppResult.success(dbData.toDomain())
  }
}
