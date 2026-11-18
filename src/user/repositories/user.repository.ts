import { Injectable } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { User } from '../entities/user.entity.js'
import type { CreateUserParams } from '../use-cases/create-user.use-case.js'
import { DataSource, QueryFailedError, type Repository } from 'typeorm'
import {
  emailUniqueConstraintName,
  UserDBEntity,
} from '../../common/database/entities/user.entity.js'
import {
  AlreadyExistsException,
  AppException,
} from '../../common/app-exception.js'

/**
 * Repository to manage user data
 */
@Injectable()
export class UserRepository {
  constructor(database: DataSource) {
    this.repository = database.getRepository(UserDBEntity)
  }

  private readonly repository: Repository<UserDBEntity>

  /**
   * Save new user based on params
   */
  async save(params: CreateUserParams): Promise<AppResult<User>> {
    try {
      const dbEntity = new UserDBEntity()
      dbEntity.name = params.name
      dbEntity.email = params.email
      const savedEntity = await this.repository.save(dbEntity)
      return AppResult.success(savedEntity.toDomain())
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const constraint = error.driverError.constraint
        if (constraint === emailUniqueConstraintName) {
          return AppResult.failed(
            new AlreadyExistsException(
              `user with email ${params.email} already exists`,
            ),
          )
        }
      }
      return AppResult.failed(
        new AppException({
          status: 500,
          title: 'Unexpected error',
          detail: `${error as Error}`,
        }),
      )
    }
  }

  async getByEmail(email: string): Promise<AppResult<User>> {
    // TODO(RDA12): implement save method
    const user = new User({
      id: 'id',
      name: email,
      email: email,
    })
    return AppResult.success(user)
  }

  async getById(id: string): Promise<AppResult<User>> {
    // TODO(RDA12): implement save method
    const user = new User({
      id: id,
      name: 'name',
      email: 'email',
    })
    return AppResult.success(user)
  }
}
