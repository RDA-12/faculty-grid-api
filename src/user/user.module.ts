import { Module } from '@nestjs/common'
import { UserRepository } from './repositories/user.repository.js'
import { CreateUserUseCase } from './use-cases/create-user.use-case.js'

@Module({
  providers: [UserRepository, CreateUserUseCase],
})
export class UserModule {}
