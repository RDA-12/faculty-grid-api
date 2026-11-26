import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { User } from '../entities/user.entity.js'
import { UserRepository } from '../repositories/user.repository.js'
import { AppResult } from '../../common/app-result.js'

/**
 * Use case to get user by their email
 */
@Injectable()
export class GetUserByEmailUseCase implements PromiseUseCase<string, User> {
  constructor(private readonly userRepository: UserRepository) {
    this.logger = new Logger('GetUserByEmailUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<User>> {
    this.logger.debug('delegate get user by email to UserRepository', {
      params,
    })
    return this.userRepository.getByEmail(params)
  }
}
