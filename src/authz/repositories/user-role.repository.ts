import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { Role, UserRoles } from '../entities/role.entity.js'
import { DataSource, QueryFailedError, Repository } from 'typeorm'
import { UserRoleDBEntity } from '../../common/database/entities/user-role.entity.js'
import {
  NotFoundException,
  UnexpectedException,
} from '../../common/app-exception.js'

/**
 * Repository to manage user roles data
 */
@Injectable()
export class UserRoleRepository {
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserRoleDBEntity)
    this.logger = new Logger('UserRoleRepository')
  }

  private readonly logger: Logger
  private readonly repository: Repository<UserRoleDBEntity>

  /**
   * Save new role if not yet assigned
   */
  async save(userId: string, role: Role): Promise<AppResult<UserRoles>> {
    try {
      this.logger.debug('start getting current user roles', { userId, role })
      const rows = await this.repository.findBy({ userId: userId })
      const roles = rows.map((it) => it.role)
      const exists = roles.includes(role)
      if (exists) {
        this.logger.debug('role already exists')
        return AppResult.success(
          new UserRoles({
            userId: userId,
            roles: roles,
          }),
        )
      }
      this.logger.debug('start saving new role')
      const userRoleDb = new UserRoleDBEntity()
      userRoleDb.userId = userId
      userRoleDb.role = role
      const newRole = await this.repository.save(userRoleDb)
      this.logger.debug('role saved', { newRole })
      return AppResult.success(
        new UserRoles({
          userId: userId,
          roles: [...roles, newRole.role],
        }),
      )
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
      this.logger.error('failed to save user role', { error })
      return AppResult.failed(new UnexpectedException(`${error as Error}`))
    }
  }

  async getByUserId(userId: string): Promise<AppResult<UserRoles>> {
    this.logger.debug('start getting user role by user id', { userId })
    const rows = await this.repository.findBy({ userId: userId })
    const roles = rows.map((it) => it.role)
    this.logger.debug('user role obtained', { roles })
    return AppResult.success(new UserRoles({ userId: userId, roles: roles }))
  }
}
