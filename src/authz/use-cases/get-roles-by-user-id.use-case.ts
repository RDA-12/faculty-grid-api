import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { UserRoles } from '../entities/role.entity.js'
import { AppResult } from '../../common/app-result.js'
import { UserRoleRepository } from '../repositories/user-role.repository.js'

/**
 * Use case to get user roles based on their user id
 */
@Injectable()
export class GetRolesByUserIdUseCase implements PromiseUseCase<
  string,
  UserRoles
> {
  constructor(private readonly userRoleRepository: UserRoleRepository) {
    this.logger = new Logger('GetRolesByUserIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<UserRoles>> {
    this.logger.debug(
      'delegating get user roles by their id to UserRoleRepository',
    )
    return this.userRoleRepository.getByUserId(params)
  }
}
