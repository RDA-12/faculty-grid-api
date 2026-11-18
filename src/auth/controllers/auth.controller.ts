import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common'
import { LoginParams, LoginUseCase } from '../use-cases/login.use-case.js'
import { LoginDTO, UserTokenOut } from './auth.dto.js'
import { AppResult } from '../../common/app-result.js'
import { Public } from '@nestjs/authentication'
import { ApiTags } from '@nestjs/swagger'

/**
 * Manage request in and response out for auth path
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {
    this.logger = new Logger('AuthController')
  }

  private readonly logger: Logger

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDTO: LoginDTO): Promise<AppResult<UserTokenOut>> {
    this.logger.debug('delegating login to LoginUseCase')
    const result = await this.loginUseCase.execute(
      new LoginParams({
        email: loginDTO.email,
        password: loginDTO.password,
      }),
    )
    if (result.data) {
      const data = result.data
      return AppResult.success(UserTokenOut.fromUserToken(data))
    }
    return result
  }
}
