import { Module } from '@nestjs/common'
import { UserRoleRepository } from './repositories/user-role.repository.js'
import { AssignRoleUseCase } from './use-cases/assign-role.use-case.js'

@Module({
  providers: [UserRoleRepository, AssignRoleUseCase],
  exports: [AssignRoleUseCase],
})
export class AuthzModule {}
