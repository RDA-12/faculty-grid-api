import { Can } from '@nestjs/authorization'
import { applyDecorators } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { ApiFailedResponse } from '../../common/app-response.js'

export function RequiredPermisson<T>(
  ...args: Parameters<typeof Can<T, string>>
) {
  return applyDecorators(
    Can(...args),
    ApiBearerAuth(),
    ApiFailedResponse({
      status: 401,
      description: 'Token is invalid/expired/missing',
    }),
    ApiFailedResponse({
      status: 403,
      description: 'Current user dont have enough permission',
    }),
  )
}
