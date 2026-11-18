import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { User } from '../entities/user.entity.js'
import type { CreateUserParams } from '../use-cases/create-user.use-case.js'
import { DataSource, QueryFailedError, type Repository } from 'typeorm'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import {
  AlreadyExistsException,
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'

/**
 * Repository to manage user data
 */
@Injectable()
export class UserRepository {
  constructor(database: DataSource) {
    this.logger = new Logger('UserRepository')
    this.repository = database.getRepository(UserDBEntity)
  }

  private readonly logger: Logger
  private readonly repository: Repository<UserDBEntity>

  /**
   * Save new user based on params
   */
  async save(params: CreateUserParams): Promise<AppResult<User>> {
    try {
      const dbEntity = new UserDBEntity()
      dbEntity.name = params.name
      dbEntity.email = params.email
      this.logger.debug('start saving new user')
      const savedEntity = await this.repository.save(dbEntity)
      this.logger.debug('user saved')
      return AppResult.success(savedEntity.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = error.driverError.code
        // Postgresql code for unique constraint violation failed
        if (code === '23505') {
          this.logger.debug('failed to save user. email already exists')
          return AppResult.failed(
            new AlreadyExistsException(
              `user with email ${params.email} already exists`,
            ),
          )
        }
      }
      this.logger.error(`failed to save user. ${error as Error}`)
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getByEmail(email: string): Promise<AppResult<User>> {
    this.logger.debug('start get user by its email')
    const result = await this.repository.findOneBy({ email })
    if (!result) {
      this.logger.debug('failed to get user. email not found')
      return AppResult.failed(
        new NotFoundException(`user with email ${email} not found`),
      )
    }
    this.logger.debug('user found')
    return AppResult.success(result.toDomain())
  }

  async getById(id: string): Promise<AppResult<User>> {
    this.logger.debug('start get user by its id')
    const result = await this.repository.findOneBy({ id })
    if (!result) {
      this.logger.debug('failed to get user. id not found')
      return AppResult.failed(
        new NotFoundException(`user with id ${id} not found`),
      )
    }
    this.logger.debug('user found')
    return AppResult.success(result.toDomain())
  }
}
