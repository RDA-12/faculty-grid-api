import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common'
import { LoginParams, LoginUseCase } from '../use-cases/login.use-case.js'
import {
  AuthUserOut,
  LoginDTO,
  RefreshTokenDTO,
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
import { ApiKeyHeader } from '../../common/decorators/api-key-header.decorator.js'
import { RefreshAccessTokenUseCase } from '../use-cases/refresh-access-token.use-case.js'

/**
 * Manage request in and response out for auth path
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerAdminUseCase: RegisterAdminUseCase,
    private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
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
    this.logger.debug('delegating login to LoginUseCase', { body: loginDTO })
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
    @ApiKeyHeader() _apiKey: string,
    @Body() registerAdminDTO: RegisterAdminDTO,
  ): Promise<AppResult<AuthUserOut>> {
    this.logger.debug('delegating register admin to RegisterAdminUseCase', {
      apiKey: _apiKey,
      body: registerAdminDTO,
    })
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

  @ApiSuccessResponse({
    status: 200,
    description: 'Access token refreshed successfully',
    model: UserTokenOut,
  })
  @ApiFailedResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  @ApiInvalidRequestResponse({
    description: 'There are invalid properties within the request body',
  })
  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refreshAccessToken(
    @Body() body: RefreshTokenDTO,
  ): Promise<AppResult<UserTokenOut>> {
    this.logger.debug(
      'delegating access token refreshment to RefreshAccessTokenUseCase',
      { body },
    )
    const result = await this.refreshAccessTokenUseCase.execute(
      body.refreshToken,
    )
    if (result.exception) {
      this.logger.debug('failed to refresh access token')
      return AppResult.failed(result.exception)
    }
    this.logger.debug('access token refreshed')
    return AppResult.success(UserTokenOut.fromUserToken(result.data!))
  }
}
