import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { User } from '../../user/entities/user.entity.js'
import { CredentialRepository } from '../repositories/credential.repository.js'
import {
  CreateUserParams,
  CreateUserUseCase,
} from '../../user/use-cases/create-user.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { AppPasswordHasher } from '../utils/app-password-hasher.util.js'
import {
  AssignRoleParams,
  AssignRoleUseCase,
} from '../../authz/use-cases/assign-role.use-case.js'
import { Role } from '../../authz/entities/role.entity.js'

export class RegisterAdminParams {
  constructor({ name, email, password }: Required<RegisterAdminParams>) {
    this.name = name
    this.email = email
    this.password = password
  }

  readonly name: string
  readonly email: string
  readonly password: string
}

/**
 * Use case to registering new admin
 */
@Injectable()
export class RegisterAdminUseCase implements PromiseUseCase<
  RegisterAdminParams,
  User
> {
  constructor(
    private readonly credentialRepository: CredentialRepository,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly passwordHashed: AppPasswordHasher,
    private readonly assignRoleUseCase: AssignRoleUseCase,
  ) {
    this.logger = new Logger('RegisterAdminUseCase')
  }

  private readonly logger: Logger

  /**
   * Start registerin new admin based on params
   */
  async execute(params: RegisterAdminParams): Promise<AppResult<User>> {
    this.logger.debug('delegating user creation to CreateUseUseCase', {
      params,
    })
    const userCreateResult = await this.createUserUseCase.execute(
      new CreateUserParams({ name: params.name, email: params.email }),
    )
    if (userCreateResult.exception) {
      this.logger.debug('user creation failed', {
        error: userCreateResult.exception,
      })
      return AppResult.failed(userCreateResult.exception)
    }
    const user = userCreateResult.data!

    this.logger.debug(
      'delegating assign user with admin role to AssignRoleUseCase',
      { user },
    )
    const assignResult = await this.assignRoleUseCase.execute(
      new AssignRoleParams({ userId: user.id, role: Role.admin }),
    )
    if (assignResult.exception) {
      this.logger.debug('failed to assign admin role', {
        error: assignResult.exception,
      })
      return AppResult.failed(assignResult.exception)
    }
    this.logger.debug('user assigned with admin role')

    this.logger.debug('delegating hashing password to AppPasswordHasher')
    const hashedResult = await this.passwordHashed.hash(params.password)
    if (hashedResult.exception) {
      this.logger.debug('password hashed failed', {
        error: hashedResult.exception,
      })
      return AppResult.failed(hashedResult.exception)
    }
    const hashed = hashedResult.data!
    this.logger.debug('password hashed', { hashedPassword: hashed })

    this.logger.debug('delegating credential creation to CredentialRepository')
    const saveResult = await this.credentialRepository.save(user.id, hashed)
    if (saveResult.exception) {
      this.logger.debug('credential creation failed', {
        error: saveResult.exception,
      })
      return AppResult.failed(saveResult.exception)
    }
    this.logger.debug('credential created', { data: saveResult.data })
    this.logger.debug('register admin success')
    return userCreateResult
  }
}
