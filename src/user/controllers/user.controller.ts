import { CurrentUser } from '@nestjs/authentication'
import { Controller, Get, Logger } from '@nestjs/common'
import type { User } from '../entities/user.entity.js'
import {
  ApiFailedResponse,
  ApiSuccessResponse,
} from '../../common/app-response.js'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserOut } from './user.dto.js'

@ApiBearerAuth()
@ApiTags('User')
@Controller('users')
export class UserController {
  constructor() {
    this.logger = new Logger('UserController')
  }

  private readonly logger: Logger

  @ApiSuccessResponse({
    status: 200,
    model: UserOut,
    description: 'Successfully get current user',
  })
  @ApiFailedResponse({
    status: 401,
    description: 'Token is expired/revoked/invalid',
  })
  @Get('me')
  getMe(@CurrentUser() user: User) {
    this.logger.debug(
      'delegating get current user to AuthenticationModule from nestjs',
    )
    return UserOut.fromUser(user)
  }
}
