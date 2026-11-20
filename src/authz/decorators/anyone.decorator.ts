import { Can } from '@nestjs/authorization'
import { applyDecorators } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { ApiFailedResponse } from '../../common/app-response.js'

export function Anyone() {
  return applyDecorators(
    Can.Anyone(),
    ApiBearerAuth(),
    ApiFailedResponse({
      status: 401,
      description: 'Token is invalid/expired/missing',
    }),
  )
}
