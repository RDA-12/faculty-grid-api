export enum Role {
  admin = 'admin',
}

type UserRolesContructor = {
  userId: string
  roles: Role[]
}

export class UserRoles {
  constructor({ userId, roles }: UserRolesContructor) {
    this.userId = userId
    this.roles = roles
  }

  readonly userId: string

  /** List of role the user have  */
  readonly roles: Role[]
}
