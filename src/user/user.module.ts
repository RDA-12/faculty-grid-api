import { Module } from '@nestjs/common'
import { UserRepository } from './repositories/user.repository.js'
import { CreateUserUseCase } from './use-cases/create-user.use-case.js'
import { GetUserByEmailUseCase } from './use-cases/get-user-by-email.use-case.js'
import { GetUserByIdUseCase } from './use-cases/get-user-by-id.use-case.js'
import { UserController } from './controllers/user.controller.js'

/**
 * Handle users data only
 *
 * User credential data like password is handled by AuthModule
 */
@Module({
  controllers: [UserController],
  providers: [
    UserRepository,
    CreateUserUseCase,
    GetUserByEmailUseCase,
    GetUserByIdUseCase,
  ],
  exports: [GetUserByEmailUseCase, GetUserByIdUseCase],
})
export class UserModule {}
