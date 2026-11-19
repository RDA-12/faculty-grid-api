export type UserContructor = {
  id: string
  name: string
  email: string
}

/**
 * Representing single user data
 */
export class User {
  readonly id: string
  readonly name: string
  readonly email: string

  constructor({ id, name, email }: UserContructor) {
    this.id = id
    this.name = name
    this.email = email
  }
}
