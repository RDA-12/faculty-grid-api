import { Policy } from '@nestjs/authorization'
import type { AuthzUser } from '../../authz/entities/authz-user.js'
import { Role } from '../../authz/entities/role.entity.js'

@Policy()
export class CoursePolicy {
  create(user: AuthzUser | null) {
    return user?.isA(Role.admin) ?? false
  }

  update(user: AuthzUser | null) {
    return user?.isA(Role.admin) ?? false
  }

  delete(user: AuthzUser | null) {
    return user?.isA(Role.admin) ?? false
  }
}
