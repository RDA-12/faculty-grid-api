import { ApiProperty } from '@nestjs/swagger'
import type { User } from '../entities/user.entity.js'

export class UserOut {
  constructor({ id, name, email }: Required<UserOut>) {
    this.id = id
    this.name = name
    this.email = email
  }

  @ApiProperty()
  readonly id: string

  @ApiProperty()
  readonly name: string

  @ApiProperty()
  readonly email: string

  static fromUser(user: User) {
    return new UserOut({
      id: user.id,
      name: user.name,
      email: user.email,
    })
  }
}
