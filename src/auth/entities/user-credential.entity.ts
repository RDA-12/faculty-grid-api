type UserCredentialConstructor = {
  userId: string
  hashedPassword: string
}

/**
 * Representing single user UserCredential
 */
export class UserCredential {
  constructor({ userId, hashedPassword }: UserCredentialConstructor) {
    this.userId = userId
    this.hashedPassword = hashedPassword
  }

  readonly userId: string
  readonly hashedPassword: string
}

type UserTokenConstructor = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * Representing single user token
 */
export class UserToken {
  constructor({ accessToken, refreshToken, expiresIn }: UserTokenConstructor) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.expiresIn = expiresIn
  }

  readonly accessToken: string
  readonly refreshToken: string
  readonly expiresIn: number
}
