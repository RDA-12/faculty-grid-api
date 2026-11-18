import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common'
import { UserToken } from '../entities/user-credential.entity.js'
import { LoginParams, LoginUseCase } from '../use-cases/login.use-case.js'
import { LoginDTO } from './auth.dto.js'
import { AppResult } from '../../common/app-result.js'
import { Public } from '@nestjs/authentication'

/**
 * Manage request in and response out for auth path
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {
    this.logger = new Logger('AuthController')
  }

  private readonly logger: Logger

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDTO: LoginDTO): Promise<AppResult<UserToken>> {
    this.logger.debug('delegating login to LoginUseCase')
    return this.loginUseCase.execute(
      new LoginParams({
        email: loginDTO.email,
        password: loginDTO.password,
      }),
    )
  }
}
