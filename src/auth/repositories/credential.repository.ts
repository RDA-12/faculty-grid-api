import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { UserCredential } from '../entities/user-credential.entity.js'
import { DataSource, QueryFailedError, Repository } from 'typeorm'
import { UserCredentialDBEntity } from '../../common/database/entities/user-credential.entity.js'
import {
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'

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

  /** Save credential for user with provided hashed password */
  async save(
    userId: string,
    hashedPassword: string,
  ): Promise<AppResult<UserCredential>> {
    try {
      const db = new UserCredentialDBEntity()
      db.userId = userId
      db.hashedPassword = hashedPassword

      this.logger.debug('start saving new user credential')
      const credentialDb = await this.repository.save(db)
      this.logger.debug('credential saved')

      return AppResult.success(credentialDb.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError?.code
        // Postgrest foreign_key_violation code
        if (code === '23503') {
          return AppResult.failed(
            new NotFoundException(`user with ID ${userId} is not found`),
          )
        }
      }
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }
}
