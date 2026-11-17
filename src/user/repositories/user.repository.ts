import { Injectable } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { User } from '../entities/user.entity.js'
import { CreateUserParams } from '../use-cases/create-user.use-case.js'

/**
 * Repository to manage user data
 */
@Injectable()
export class UserRepository {
  /**
   * Save new user based on params
   */
  async save(params: CreateUserParams): Promise<AppResult<User>> {
    // TODO(RDA12): implement save method
    const user = new User({
      id: 'id',
      name: params.name,
      email: params.email,
    })
    return AppResult.success(user)
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
}
