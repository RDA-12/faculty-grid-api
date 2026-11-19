import { User, UserContructor } from '../../user/entities/user.entity.js'
import { Role } from './role.entity.js'

type AuthzUserConstructor = {
  roles: Role[]
} & UserContructor

/**
 * Representing single user with their roles
 */
export class AuthzUser extends User {
  constructor({ id, name, email, roles }: AuthzUserConstructor) {
    super({
      id: id,
      name: name,
      email: email,
    })
    this.roles = roles
  }

  readonly roles: Role[]

  isA(role: Role): boolean {
    return this.roles.includes(role)
  }
}
