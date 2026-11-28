import { Module } from '@nestjs/common'
import { UserRoleRepository } from './repositories/user-role.repository.js'
import { AssignRoleUseCase } from './use-cases/assign-role.use-case.js'
import { AuthorizationModule } from '@nestjs/authorization'
import { User } from '../user/entities/user.entity.js'
import { GetRolesByUserIdUseCase } from './use-cases/get-roles-by-user-id.use-case.js'
import { AuthzUser } from './entities/authz-user.js'
import { FacultyPolicy } from '../organization/policies/faculty.policy.js'
import { ProgramPolicy } from '../organization/policies/program.policy.js'
import { TitlePolicy } from '../organization/policies/title.policy.js'
import { RankPolicy } from '../lecturer/policies/rank.policy.js'
import { FunctionalRankPolicy } from '../lecturer/policies/functional-rank.policy.js'
import { LecturerPolicy } from '../lecturer/policies/lecturer.policy.js'

@Module({
  imports: [
    AuthorizationModule.forRootAsync({
      imports: [AuthzModule],
      policies: [
        FacultyPolicy,
        ProgramPolicy,
        TitlePolicy,
        RankPolicy,
        FunctionalRankPolicy,
        LecturerPolicy,
      ],
      useFactory: (getRolesByUserIdUseCase: GetRolesByUserIdUseCase) => {
        return {
          getUser: async (context) => {
            const ctx = context.switchToHttp().getRequest()
            const user: User | null | undefined = ctx.user
            if (!user) return user ?? null

            const rolesResult = await getRolesByUserIdUseCase.execute(user.id)
            if (rolesResult.exception) return null

            return new AuthzUser({
              id: user.id,
              name: user.name,
              email: user.email,
              roles: rolesResult.data!.roles,
            })
          },
        }
      },
      inject: [GetRolesByUserIdUseCase],
    }),
  ],
  providers: [UserRoleRepository, AssignRoleUseCase, GetRolesByUserIdUseCase],
  exports: [AssignRoleUseCase, GetRolesByUserIdUseCase],
})
export class AuthzModule {}
