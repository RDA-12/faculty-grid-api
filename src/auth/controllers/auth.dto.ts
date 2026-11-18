import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'
import type { UserToken } from '../entities/user-credential.entity.js'

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
