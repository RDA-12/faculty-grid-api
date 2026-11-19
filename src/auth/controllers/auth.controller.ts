import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common'
import { LoginParams, LoginUseCase } from '../use-cases/login.use-case.js'
import {
  AuthUserOut,
  LoginDTO,
  RegisterAdminDTO,
  UserTokenOut,
} from './auth.dto.js'
import { AppResult } from '../../common/app-result.js'
import { Public } from '@nestjs/authentication'
import { ApiTags } from '@nestjs/swagger'
import {
  ApiFailedResponse,
  ApiInvalidRequestResponse,
  ApiSuccessResponse,
} from '../../common/app-response.js'
import {
  RegisterAdminParams,
  RegisterAdminUseCase,
} from '../use-cases/register-admin.user-case.js'

/**
 * Manage request in and response out for auth path
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerAdminUseCase: RegisterAdminUseCase,
  ) {
    this.logger = new Logger('AuthController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 200,
    description: 'Login success',
    model: UserTokenOut,
  })
  @ApiFailedResponse({
    status: 401,
    description: 'Invalid email/password',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid properties within the request body',
  })
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

  @ApiSuccessResponse({
    status: 201,
    description: 'Register admin success',
    model: AuthUserOut,
  })
  @ApiFailedResponse({
    status: 409,
    description: 'User with provided email already exists',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid properties within the request body',
  })
  @Public()
  @Post('register-admin')
  async registerAdmin(
    @Body() registerAdminDTO: RegisterAdminDTO,
  ): Promise<AppResult<AuthUserOut>> {
    this.logger.debug('delegating register admin to RegisterAdminUseCase')
    const result = await this.registerAdminUseCase.execute(
      new RegisterAdminParams({
        name: registerAdminDTO.name,
        email: registerAdminDTO.email,
        password: registerAdminDTO.password,
      }),
    )
    if (result.data) {
      const data = result.data
      return AppResult.success(AuthUserOut.fromUser(data))
    }
    return AppResult.failed(result.exception!)
  }
}
