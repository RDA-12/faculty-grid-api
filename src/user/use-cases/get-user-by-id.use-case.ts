import { Injectable, Logger } from '@nestjs/common'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { User } from '../entities/user.entity.js'
import { UserRepository } from '../repositories/user.repository.js'
import { AppResult } from '../../common/app-result.js'

/**
 * Use case to get user by their Id
 */
@Injectable()
export class GetUserByIdUseCase implements PromiseUseCase<string, User> {
  constructor(private readonly userRepository: UserRepository) {
    this.logger = new Logger('GetUserByIdUseCase')
  }

  private readonly logger: Logger

  execute(params: string): Promise<AppResult<User>> {
    this.logger.debug('delegate get user by Id to UserRepository', { params })
    return this.userRepository.getById(params)
  }
}
