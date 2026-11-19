import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { Role, UserRoles } from '../entities/role.entity.js'
import { UserRoleRepository } from '../repositories/user-role.repository.js'

/** Params for AssignRoleUseCase */
export class AssignRoleParams {
  constructor({ userId, role }: Required<AssignRoleParams>) {
    this.userId = userId
    this.role = role
  }

  readonly userId: string
  readonly role: Role
}

/**
 * Use case to assigning role to a user
 */
@Injectable()
export class AssignRoleUseCase implements PromiseUseCase<
  AssignRoleParams,
  UserRoles
> {
  constructor(private readonly userRoleRepository: UserRoleRepository) {
    this.logger = new Logger('AssignRoleUseCase')
  }

  private readonly logger: Logger

  execute(params: AssignRoleParams): Promise<AppResult<UserRoles>> {
    this.logger.debug('delegating saving assigned role to UserRoleRepository')
    return this.userRoleRepository.save(params.userId, params.role)
  }
}
