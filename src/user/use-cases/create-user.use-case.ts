import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { User } from '../entities/user.entity.js'
import { AppResult } from '../../common/app-result.js'
import { type UserRepository } from '../repositories/user.repository.js'

type CreateUserParamsConstructor = {
  name: string
  email: string
}

/**
 * Params for CreateUserUseCase
 */
export class CreateUserParams {
  readonly name: string
  readonly email: string

  constructor({ name, email }: CreateUserParamsConstructor) {
    this.name = name
    this.email = email
  }
}

/**
 * Use case to create new user
 */
@Injectable()
export class CreateUserUseCase implements PromiseUseCase<
  CreateUserParams,
  User
> {
  constructor(private readonly userRepository: UserRepository) {
    this.logger = new Logger('CreateUserUseCase')
  }

  private readonly logger: Logger

  execute(params: CreateUserParams): Promise<AppResult<User>> {
    this.logger.debug('delegate user creation for UserRepository')
    return this.userRepository.save(params)
  }
}
