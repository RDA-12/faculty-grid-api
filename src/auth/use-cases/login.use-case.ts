import { Injectable, Logger } from '@nestjs/common'
import { AppResult } from '../../common/app-result.js'
import { PromiseUseCase } from '../../common/base-use-case.js'
import { GetUserByEmailUseCase } from '../../user/use-cases/get-user-by-email.use-case.js'
import { CredentialRepository } from '../repositories/credential.repository.js'
import { InvalidCredentialException } from '../../common/app-exception.js'
import { UserToken } from '../entities/user-credential.entity.js'
import { AppPasswordHasher } from '../utils/app-password-hasher.util.js'
import { JWT } from '../utils/jwt.util.js'

type LoginParamsConstructor = {
  email: string
  password: string
}

/**
 * Params for LoginUseCase
 */
export class LoginParams {
  readonly email: string
  readonly password: string

  constructor({ email, password }: LoginParamsConstructor) {
    this.email = email
    this.password = password
  }
}

/**
 * Use case to logging in user with their email & password
 */
@Injectable()
export class LoginUseCase implements PromiseUseCase<LoginParams, UserToken> {
  constructor(
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly passwordHasher: AppPasswordHasher,
    private readonly credentialRepository: CredentialRepository,
    private readonly jwt: JWT,
  ) {
    this.logger = new Logger('LoginUseCase')
  }

  private readonly logger: Logger

  async execute(params: LoginParams): Promise<AppResult<UserToken>> {
    this.logger.debug('delegate getting user to GetUserByEmailUseCase')
    const userResult = await this.getUserByEmailUseCase.execute(params.email)
    if (userResult.exception) {
      this.logger.debug('GetUserByEmailUseCase failed')
      return AppResult.failed(userResult.exception)
    }
    this.logger.debug('user obtained')
    const user = userResult.data!

    this.logger.debug('delegate get user credential to CredentialRepository')
    const credentialResult = await this.credentialRepository.getByUserId(
      user.id,
    )
    if (credentialResult.exception) {
      this.logger.debug('CredentialRepository failed')
      return AppResult.failed(credentialResult.exception)
    }
    this.logger.debug('credential obtained')
    const credential = credentialResult.data!

    this.logger.debug('delegate verify provided password to AppPasswordHasher')
    const hashResult = await this.passwordHasher.verify(
      params.password,
      credential.hashedPassword,
    )
    if (hashResult.exception) {
      this.logger.debug('AppPasswordHasher failed')
      return AppResult.failed(hashResult.exception)
    }
    const verfied = hashResult.data
    if (!verfied) {
      this.logger.debug('provided password is wrong')
      return AppResult.failed(new InvalidCredentialException())
    }
    this.logger.debug('password is verified')

    this.logger.debug('delegate token generation to JWT')
    const issueResult = await this.jwt.issue(user.id)
    if (issueResult.exception) {
      this.logger.debug('token generation failed')
      return AppResult.failed(issueResult.exception)
    }
    this.logger.debug('token generation success')
    return issueResult
  }
}
