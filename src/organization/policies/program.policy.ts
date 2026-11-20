import { Policy } from '@nestjs/authorization'
import type { AuthzUser } from '../../authz/entities/authz-user.js'
import { Role } from '../../authz/entities/role.entity.js'

@Policy()
export class ProgramPolicy {
  create(user: AuthzUser | null) {
    return user?.isA(Role.admin) ?? false
  }
}
