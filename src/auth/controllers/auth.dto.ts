import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'
import type { UserToken } from '../entities/user-credential.entity.js'
import { User } from '../../user/entities/user.entity.js'

export class LoginDTO {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  password: string
}

export class UserTokenOut {
  constructor({
    accessToken,
    refreshToken,
    expiresIn,
  }: Required<UserTokenOut>) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.expiresIn = expiresIn
  }

  static fromUserToken(userToken: UserToken) {
    return new UserTokenOut({
      accessToken: userToken.accessToken,
      refreshToken: userToken.refreshToken,
      expiresIn: userToken.expiresIn,
    })
  }

  @ApiProperty()
  accessToken: string

  @ApiProperty()
  refreshToken: string

  @ApiProperty()
  expiresIn: number
}

export class RegisterAdminDTO {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  password: string
}

export class AuthUserOut {
  constructor({ id, name, email }: Required<AuthUserOut>) {
    this.id = id
    this.name = name
    this.email = email
  }

  static fromUser(user: User) {
    return new AuthUserOut({ id: user.id, name: user.name, email: user.email })
  }

  @ApiProperty()
  readonly id: string

  @ApiProperty()
  readonly name: string

  @ApiProperty()
  readonly email: string
}

export class RefreshTokenDTO {
  constructor(refreshToken: string) {
    this.refreshToken = refreshToken
  }

  @IsString()
  readonly refreshToken: string
}
