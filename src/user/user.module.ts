import { Module } from '@nestjs/common'
import { UserRepository } from './repositories/user.repository.js'
import { CreateUserUseCase } from './use-cases/create-user.use-case.js'
import { GetUserByEmailUseCase } from './use-cases/get-user-by-email.use-case.js'

@Module({
  providers: [UserRepository, CreateUserUseCase, GetUserByEmailUseCase],
})
export class UserModule {}
